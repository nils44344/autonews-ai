import { generateJSON } from "../ai";
import { prisma } from "../db";
import { similarity, wordCount } from "../utils";
import { HOUSE_STYLE, qualityRubricPrompt } from "../content/prompts";
import { qualitySchema, type QualityResult } from "../content/schemas";
import { spamScore } from "./safety";

export interface QualityReport extends QualityResult {
  heuristics: {
    wordCount: number;
    headingCount: number;
    spamScore: number;
    duplicateSimilarity: number;
  };
  finalScore: number;
}

/**
 * Blend an LLM rubric with deterministic heuristics into a single 0-100 score.
 * Heuristics are cheap guardrails the model can't talk its way around
 * (length, structure, keyword stuffing, near-duplicate of existing content).
 */
export async function assessArticle(articleId: string): Promise<QualityReport> {
  const article = await prisma.article.findUniqueOrThrow({ where: { id: articleId } });

  // 1) Deterministic heuristics.
  const wc = wordCount(article.body);
  const headingCount = (article.body.match(/^#{2,3}\s/gm) || []).length;
  const spam = spamScore(article.body, article.keywords);

  // Near-duplicate check against recent published articles (originality guard).
  const recent = await prisma.article.findMany({
    where: { status: "PUBLISHED", id: { not: article.id } },
    select: { title: true, excerpt: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  const dupSim = recent.reduce(
    (m, r) => Math.max(m, similarity(article.title, r.title)),
    0,
  );

  // 2) LLM rubric.
  let rubric: QualityResult;
  try {
    rubric = qualitySchema.parse(
      await generateJSON(qualityRubricPrompt(article.title, article.body), {
        system: HOUSE_STYLE,
        temperature: 0.2,
        // Scoring is a small judgement task — use the cheap model and keep the
        // premium content model's daily token budget for writing articles.
        model: "llama-3.1-8b-instant",
      }),
    );
  } catch {
    // If the QA model fails, fall back to neutral scores so heuristics decide.
    rubric = {
      originality: 60, readability: 60, grammar: 60, factualConsistency: 60,
      seo: 60, spamRisk: spam, issues: ["qa-model-unavailable"], verdict: "revise",
    };
  }

  // 3) Blend. Penalise short pieces, missing structure, spam, duplication.
  const lengthOk = wc >= 600 ? 100 : (wc / 600) * 100;
  const structureOk = headingCount >= 3 ? 100 : (headingCount / 3) * 100;
  const dupPenalty = dupSim > 0.6 ? (dupSim - 0.6) * 200 : 0;

  const finalScore = Math.max(
    0,
    Math.min(
      100,
      0.18 * rubric.originality +
        0.18 * rubric.readability +
        0.14 * rubric.grammar +
        0.16 * rubric.factualConsistency +
        0.14 * rubric.seo +
        0.10 * lengthOk +
        0.10 * structureOk -
        0.5 * Math.max(spam, rubric.spamRisk) * 0.4 -
        dupPenalty,
    ),
  );

  const report: QualityReport = {
    ...rubric,
    heuristics: { wordCount: wc, headingCount, spamScore: spam, duplicateSimilarity: dupSim },
    finalScore: Math.round(finalScore),
  };

  await prisma.article.update({
    where: { id: articleId },
    data: { qualityScore: report.finalScore, qualityReport: report as object },
  });

  return report;
}
