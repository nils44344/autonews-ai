import type { TrendTopic } from "@prisma/client";
import { generateJSON } from "../ai";
import { prisma } from "../db";
import { fetchArticleImage } from "../images";
import { readingMinutes, uniqueSlug, wordCount } from "../utils";
import { HOUSE_STYLE, newsArticlePrompt } from "./prompts";
import { generatedArticleSchema } from "./schemas";

function lengthFor(topic: TrendTopic): { min: number; max: number } {
  if (topic.isBreaking) return { min: 800, max: 1200 }; // breaking news
  if (topic.finalScore >= 65) return { min: 1500, max: 2500 }; // major news
  return { min: 2000, max: 4000 }; // evergreen / deep coverage
}

// Hard news (an event/announcement) → NEWS section. Evergreen/explainer/opinion
// topics → BLOG. Keeps the news section to actual news; analysis lives in blog.
const NEWS_EVENT = /\b(raises?|raised|funding|launch(es|ed)?|announce[sd]?|acquire[sd]?|merger|partners?|appoints?|resigns?|steps? down|dies?|died|passes? away|files?|ipo|lists?|listing|surges?|plunges?|falls?|jumps?|drops?|hits?|posts?|reports?|results?|earnings|revenue|profit|wins?|bans?|banned|approve[sd]?|fine[sd]?|unveils?|secures?|valuation|valued|layoffs?|shut(s|down)?|expands?|backs?|invest(s|ed)?|stake|deal|q[1-4]\b|crore|lakh|billion|million|sensex|nifty|rbi|sebi|launches|recalls?|sues?|hikes?|slumps?|rallies)\b/i;
const EXPLAINER = /\b(how to|what is|guide|explained?|explainer|best |top \d|vs\.?|versus|tips|why you|everything you|ultimate|beginners?|tutorial|review|comparison|should you|things to)\b/i;

function classifyType(topic: TrendTopic): "NEWS" | "BLOG" {
  const t = topic.title.toLowerCase();
  if (EXPLAINER.test(t)) return "BLOG";
  if (topic.isBreaking || NEWS_EVENT.test(t)) return "NEWS";
  // Multi-source, fresh items off news feeds are almost always events → NEWS;
  // low-signal lone items read more like evergreen explainers → BLOG.
  return topic.sourceCount >= 2 ? "NEWS" : "BLOG";
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
  const articleType = classifyType(topic);

  // Smaller models (8B) occasionally return a too-short body or wrap the object
  // in an array. Retry once and unwrap arrays before validating.
  const prompt = newsArticlePrompt({
    title: topic.title,
    keywords: topic.keywords,
    category: topic.category,
    context,
    minWords: min,
    maxWords: max,
    type: articleType,
  });
  let parsed: ReturnType<typeof generatedArticleSchema.parse> | null = null;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let raw: unknown = await generateJSON(prompt, {
        system: HOUSE_STYLE,
        temperature: 0.7,
        maxTokens: 4096,
      });
      if (Array.isArray(raw)) raw = raw[0];
      parsed = generatedArticleSchema.parse(raw);
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!parsed) throw lastErr;
  const category = await ensureCategory(topic.category, "news");
  const wc = wordCount(parsed.body);
  const image = await fetchArticleImage(
    topic.category,
    parsed.keywords.length ? parsed.keywords : topic.keywords,
  );

  const article = await prisma.article.create({
    data: {
      type: articleType,
      status: "DRAFT",
      title: parsed.title,
      slug: uniqueSlug(parsed.title),
      dek: parsed.dek,
      body: parsed.body,
      excerpt: parsed.excerpt,
      ogImage: image?.url,
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
      isPillar: articleType === "NEWS",
      clusterId: topic.id, // the news piece is the hub of its cluster
    },
  });

  await prisma.trendTopic.update({ where: { id: topicId }, data: { status: "GENERATED" } });
  return article;
}
