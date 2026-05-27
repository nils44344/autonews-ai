import type { TrendTopic } from "@prisma/client";
import { generateJSON } from "../ai";
import { prisma } from "../db";
import { fetchArticleImage } from "../images";
import { readingMinutes, uniqueSlug, wordCount } from "../utils";
import { HOUSE_STYLE, factCheckPrompt, newsArticlePrompt } from "./prompts";
import { factCheckArticleSchema, generatedArticleSchema, type GeneratedArticle } from "./schemas";

// Length targets. The body must fit the completion-token budget (MAX_TOKENS;
// ~1 word ≈ 1.4 tokens + JSON/field overhead) AND the request as a whole
// (prompt + max_tokens) must stay under the model's per-request TPM cap.
// gpt-oss-120b allows 8000 TPM, so the structured prompt (~1.8k tokens) plus
// MAX_TOKENS=5500 (~3.9k words of room) fits with headroom.
function lengthFor(topic: TrendTopic): { min: number; max: number } {
  if (topic.isBreaking) return { min: 800, max: 1100 }; // breaking news
  if (topic.finalScore >= 65) return { min: 1100, max: 1500 }; // major news
  return { min: 1200, max: 1600 }; // evergreen / deep coverage
}

const MAX_TOKENS = 5500;

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

// Dispute/controversy markers → route to the neutral fact-check writer instead
// of a straight news piece. Deliberately specific (real dispute language) so we
// don't turn ordinary news into awkward "fact-checks".
const CONTROVERSY =
  /\b(controvers(y|ial)|backlash|slammed|criticis(ed|m)|outrage|trolled|sparks? (a )?row|accus(ed|ation)|alleg(ed|ation|edly)|denies|denied|hits? back|clarifies|clarification|disputed?|fact[- ]?check|misleading|fake news|hoax|debunk|rumou?r|snubbed?|apologis|under fire|faces? flak|no[- ]?ball|umpir(e|ing)|\bdrs\b|wrongly|robbed|was .*\b(out|not out)\b)/i;

function isFactCheck(topic: TrendTopic): boolean {
  return CONTROVERSY.test(topic.title);
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
  // Controversy/dispute topics get the neutral fact-check treatment (own section
  // + ClaimReview structured data); everything else is a normal news piece.
  const factCheck = isFactCheck(topic);
  const articleType: "NEWS" | "BLOG" = factCheck ? "NEWS" : classifyType(topic);
  const categoryName = factCheck ? "Fact Check" : topic.category;

  // Smaller models occasionally return a too-short body, wrap the object in an
  // array, or produce JSON Groq's validator rejects. Retry up to 3×; each retry
  // drops the temperature (lower temp = more reliable structure).
  const prompt = factCheck
    ? factCheckPrompt({
        title: topic.title,
        keywords: topic.keywords,
        category: "Fact Check",
        context,
        minWords: min,
        maxWords: max,
        type: "NEWS",
      })
    : newsArticlePrompt({
        title: topic.title,
        keywords: topic.keywords,
        category: topic.category,
        context,
        minWords: min,
        maxWords: max,
        type: articleType,
      });

  let parsed: GeneratedArticle | null = null;
  let fc: { claimReviewed: string; rating: string; verdict: string } | null = null;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      let raw: unknown = await generateJSON(prompt, {
        system: HOUSE_STYLE,
        temperature: attempt === 1 ? 0.7 : 0.35,
        maxTokens: MAX_TOKENS,
      });
      if (Array.isArray(raw)) raw = raw[0];
      if (factCheck) {
        const p = factCheckArticleSchema.parse(raw);
        parsed = p;
        fc = { claimReviewed: p.claimReviewed, rating: p.rating, verdict: p.verdict };
      } else {
        parsed = generatedArticleSchema.parse(raw);
      }
      break;
    } catch (err) {
      lastErr = err;
    }
  }
  if (!parsed) throw lastErr;
  const category = await ensureCategory(categoryName, "news");
  const wc = wordCount(parsed.body);
  const image = await fetchArticleImage(
    categoryName,
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
      factCheck: fc ?? undefined,
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
