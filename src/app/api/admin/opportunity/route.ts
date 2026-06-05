import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorizeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeOpportunityScore } from "@/lib/opportunity-score";
import { uniqueSlug } from "@/lib/utils";

// Admin CRUD for Opportunities. Used by the seed script + future curation UI.
// POST   create or upsert (by slug)
// PATCH  partial update by id
// DELETE archive by id (we never hard-delete — keeps history)
//
// All requests must carry the admin token via authorizeRequest.

const upsertSchema = z.object({
  slug: z.string().optional(),
  title: z.string().min(8),
  kind: z.enum([
    "BUSINESS",
    "STARTUP",
    "AUTOMATION",
    "CREATOR",
    "AGENCY",
    "NICHE",
    "MONETIZATION",
  ]).default("BUSINESS"),
  summary: z.string().min(20),
  whyItMatters: z.string().min(20),
  marketContext: z.string().optional(),
  implementation: z.string().optional(),
  monetizationPaths: z.array(z.object({
    path: z.string(),
    model: z.string().optional(),
    revenueRange: z.string().optional(),
  })).optional(),
  recommendedTools: z.array(z.object({
    name: z.string(),
    url: z.string().url().optional(),
    why: z.string().optional(),
  })).optional(),
  relatedWorkflows: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
  })).optional(),
  relatedArticleIds: z.array(z.string()).optional(),
  demandScore: z.number().min(0).max(100).default(50),
  growthScore: z.number().min(0).max(100).default(50),
  competitionScore: z.number().min(0).max(100).default(50),
  monetizationScore: z.number().min(0).max(100).default(50),
  difficultyScore: z.number().min(0).max(100).default(50),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  ogImage: z.string().url().optional(),
  publish: z.boolean().default(false),
});

export async function POST(req: Request) {
  if (!authorizeRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = upsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request", issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  const score = computeOpportunityScore({
    demandScore: d.demandScore,
    growthScore: d.growthScore,
    competitionScore: d.competitionScore,
    monetizationScore: d.monetizationScore,
    difficultyScore: d.difficultyScore,
  });

  // Resolve slug — provided wins, else derive from title. uniqueSlug appends
  // a short suffix on collisions so we never crash on re-runs.
  const slug = d.slug ?? uniqueSlug(d.title);

  const data = {
    title: d.title,
    kind: d.kind,
    summary: d.summary,
    whyItMatters: d.whyItMatters,
    marketContext: d.marketContext,
    implementation: d.implementation,
    // Prisma JSON columns don't accept literal null in the typed input — use
    // undefined to skip the field, which leaves it null in the DB.
    monetizationPaths: d.monetizationPaths ?? undefined,
    recommendedTools: d.recommendedTools ?? undefined,
    relatedWorkflows: d.relatedWorkflows ?? undefined,
    relatedArticleIds: d.relatedArticleIds ?? [],
    demandScore: d.demandScore,
    growthScore: d.growthScore,
    competitionScore: d.competitionScore,
    monetizationScore: d.monetizationScore,
    difficultyScore: d.difficultyScore,
    opportunityScore: score,
    seoTitle: d.seoTitle,
    seoDescription: d.seoDescription,
    keywords: d.keywords,
    ogImage: d.ogImage,
    status: d.publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
    publishedAt: d.publish ? new Date() : null,
  };

  const row = await prisma.opportunity.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });

  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${slug}`);
  revalidatePath("/");

  return NextResponse.json({ ok: true, id: row.id, slug: row.slug, score });
}
