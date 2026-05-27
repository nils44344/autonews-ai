import { z } from "zod";

export const generatedArticleSchema = z.object({
  title: z.string().min(8),
  dek: z.string().optional().default(""),
  body: z.string().min(200),
  excerpt: z.string().optional().default(""),
  seoTitle: z.string().optional().default(""),
  seoDescription: z.string().optional().default(""),
  keywords: z.array(z.string()).default([]),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
  sources: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
});
export type GeneratedArticle = z.infer<typeof generatedArticleSchema>;

// Fact-check / controversy analysis. Extends a normal article with a single
// checked claim, an honest rating, and a one-line neutral verdict — the data
// behind the on-page verdict box and ClaimReview structured data.
export const FACT_CHECK_RATINGS = [
  "True",
  "Mostly True",
  "Mixed",
  "Misleading",
  "Mostly False",
  "False",
  "Unproven",
  "Disputed",
] as const;

export const factCheckArticleSchema = generatedArticleSchema.extend({
  claimReviewed: z.string().min(4), // the specific claim being assessed
  rating: z
    .string()
    .transform((s) => {
      const hit = FACT_CHECK_RATINGS.find((r) => r.toLowerCase() === s.trim().toLowerCase());
      return hit ?? "Unproven";
    })
    .default("Unproven"),
  verdict: z.string().min(8), // one-sentence neutral conclusion
});
export type FactCheckArticle = z.infer<typeof factCheckArticleSchema>;

export const blogClusterSchema = z.object({
  pillar: z.string(),
  posts: z
    .array(
      z.object({
        title: z.string(),
        intent: z.string(),
        angle: z.string(),
        keywords: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});
export type BlogCluster = z.infer<typeof blogClusterSchema>;

export const memeSchema = z.object({
  memeWorthy: z.boolean(),
  reason: z.string().default(""),
  format: z.string().default("two-panel"),
  topText: z.string().optional().default(""),
  bottomText: z.string().optional().default(""),
  caption: z.string().default(""),
  imagePrompt: z.string().default(""),
});
export type GeneratedMeme = z.infer<typeof memeSchema>;

export const qualitySchema = z.object({
  originality: z.number(),
  readability: z.number(),
  grammar: z.number(),
  factualConsistency: z.number(),
  seo: z.number(),
  spamRisk: z.number(),
  issues: z.array(z.string()).default([]),
  verdict: z.enum(["approve", "revise", "reject"]).default("revise"),
});
export type QualityResult = z.infer<typeof qualitySchema>;
