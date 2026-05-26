import type { TrendTopic } from "@prisma/client";
import { generateJSON } from "../ai";
import { prisma } from "../db";
import { readingMinutes, uniqueSlug, wordCount } from "../utils";
import { HOUSE_STYLE, newsArticlePrompt } from "./prompts";
import { generatedArticleSchema } from "./schemas";

function lengthFor(topic: TrendTopic): { min: number; max: number } {
  if (topic.isBreaking) return { min: 800, max: 1200 }; // breaking news
  if (topic.finalScore >= 65) return { min: 1500, max: 2500 }; // major news
  return { min: 2000, max: 4000 }; // evergreen / deep coverage
}

async function ensureCategory(name: string, kind = "news") {
  const slugified = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return prisma.category.upsert({
    where: { slug: slugified },
    update: {},
    create: { name, slug: slugified, kind },
  });
}

/** Generate a NEWS article from a trend topic and persist it as a DRAFT. */
export async function writeNewsArticle(topicId: string) {
  const topic = await prisma.trendTopic.findUniqueOrThrow({
    where: { id: topicId },
    include: { signals: { orderBy: { score: "desc" }, take: 8 } },
  });

  await prisma.trendTopic.update({ where: { id: topicId }, data: { status: "GENERATING" } });

  const context = topic.signals
    .map((s) => `- ${s.title}${s.summary ? `: ${s.summary}` : ""}${s.url ? ` (${s.url})` : ""}`)
    .join("\n");
  const { min, max } = lengthFor(topic);

  const raw = await generateJSON(
    newsArticlePrompt({
      title: topic.title,
      keywords: topic.keywords,
      category: topic.category,
      context,
      minWords: min,
      maxWords: max,
      type: "NEWS",
    }),
    { system: HOUSE_STYLE, temperature: 0.7, maxTokens: 4096 },
  );

  const parsed = generatedArticleSchema.parse(raw);
  const category = await ensureCategory(topic.category, "news");
  const wc = wordCount(parsed.body);

  const article = await prisma.article.create({
    data: {
      type: "NEWS",
      status: "DRAFT",
      title: parsed.title,
      slug: uniqueSlug(parsed.title),
      dek: parsed.dek,
      body: parsed.body,
      excerpt: parsed.excerpt,
      seoTitle: parsed.seoTitle || parsed.title,
      seoDescription: parsed.seoDescription || parsed.excerpt,
      keywords: parsed.keywords.length ? parsed.keywords : topic.keywords,
      faq: parsed.faq,
      sources: parsed.sources.length
        ? parsed.sources
        : topic.signals.filter((s) => s.url).map((s) => ({ title: s.title, url: s.url })),
      wordCount: wc,
      readingMin: readingMinutes(parsed.body),
      categoryId: category.id,
      topicId: topic.id,
      isPillar: true,
      clusterId: topic.id, // the news piece is the hub of its cluster
    },
  });

  await prisma.trendTopic.update({ where: { id: topicId }, data: { status: "GENERATED" } });
  return article;
}
