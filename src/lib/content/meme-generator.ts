import { generateJSON } from "../ai";
import { env } from "../env";
import { prisma } from "../db";
import { uniqueSlug } from "../utils";
import { checkMemeSafety } from "../quality/safety";
import { HOUSE_STYLE, memePrompt } from "./prompts";
import { memeSchema } from "./schemas";

async function ensureCategory(name: string) {
  const slugified = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return prisma.category.upsert({
    where: { slug: slugified },
    update: {},
    create: { name, slug: slugified, kind: "meme" },
  });
}

/**
 * Decide if a topic is meme-worthy and, if so, generate a meme concept plus an
 * AI image prompt. Runs a safety filter; unsafe/borderline memes are rejected.
 */
export async function generateMeme(topicId: string) {
  const topic = await prisma.trendTopic.findUniqueOrThrow({ where: { id: topicId } });

  const meme = memeSchema.parse(
    await generateJSON(memePrompt(topic.title, topic.category), {
      system: HOUSE_STYLE,
      temperature: 0.9,
    }),
  );

  if (!meme.memeWorthy) {
    await prisma.jobLog.create({
      data: { job: "meme", status: "ok", message: `skipped: ${meme.reason}`, meta: { topicId } },
    });
    return null;
  }

  // Defence-in-depth: rule-based safety filter on top of the model's judgement.
  const safety = checkMemeSafety(`${topic.title} ${meme.topText} ${meme.bottomText} ${meme.caption}`);
  // Unsafe → REJECTED. Safe → auto-publish in auto mode, else park in REVIEW.
  const passed = safety.score >= 70;
  const status = !passed ? "REJECTED" : env.PUBLISH_MODE === "auto" ? "PUBLISHED" : "REVIEW";

  const category = await ensureCategory(topic.category);

  return prisma.meme.create({
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
      title: `${topic.title} — meme`.slice(0, 180),
      slug: uniqueSlug(topic.title),
      format: meme.format,
      topText: meme.topText,
      bottomText: meme.bottomText,
      caption: meme.caption,
      imagePrompt: meme.imagePrompt,
      categoryId: category.id,
      topicId: topic.id,
      safetyScore: safety.score,
      safetyReport: safety as object,
    },
  });
}
