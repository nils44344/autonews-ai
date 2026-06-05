import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { safe } from "@/lib/safe";

// Regenerate so new articles appear (was being cached as a static build asset).
export const dynamic = "force-dynamic";
export const revalidate = 600;

// Dynamic XML sitemap — Next.js serves this at /sitemap.xml automatically.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, opportunities, tools, workflows, startups] = await Promise.all([
    safe(
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, type: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
        take: 5000,
      }),
      [] as { slug: string; type: "NEWS" | "BLOG"; updatedAt: Date; publishedAt: Date | null }[],
    ),
    // Only list category hubs that actually have published articles, so the
    // sitemap never points crawlers at empty pages.
    safe(
      prisma.category.findMany({
        where: { articles: { some: { status: "PUBLISHED" } } },
        select: { slug: true },
      }),
      [] as { slug: string }[],
    ),
    // Pillar 1 — Opportunities (the moat).
    safe(prisma.opportunity.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { opportunityScore: "desc" },
      take: 2000,
    }), [] as { slug: string; updatedAt: Date }[]),
    // Pillar 3 — Tools.
    safe(prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      take: 2000,
    }), [] as { slug: string; updatedAt: Date }[]),
    // Pillar 4 — Workflows.
    safe(prisma.workflow.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      take: 2000,
    }), [] as { slug: string; updatedAt: Date }[]),
    // Pillar 5 — Startups.
    safe(prisma.startup.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      take: 2000,
    }), [] as { slug: string; updatedAt: Date }[]),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: env.SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${env.SITE_URL}/opportunities`, changeFrequency: "daily", priority: 0.95 },
    { url: `${env.SITE_URL}/signals`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${env.SITE_URL}/tools`, changeFrequency: "daily", priority: 0.9 },
    { url: `${env.SITE_URL}/workflows`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${env.SITE_URL}/startups`, changeFrequency: "daily", priority: 0.85 },
    { url: `${env.SITE_URL}/news`, changeFrequency: "hourly", priority: 0.85 },
    { url: `${env.SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${env.SITE_URL}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${env.SITE_URL}/editorial-policy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${env.SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${env.SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Category hubs — strong internal-link targets; refreshed as new stories land.
  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${env.SITE_URL}/category/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const dynamic: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${env.SITE_URL}/${a.type === "BLOG" ? "blog" : "article"}/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: a.type === "BLOG" ? "weekly" : "daily",
    priority: a.type === "BLOG" ? 0.6 : 0.7,
  }));

  const opportunityPages: MetadataRoute.Sitemap = opportunities.map((o) => ({
    url: `${env.SITE_URL}/opportunities/${o.slug}`,
    lastModified: o.updatedAt,
    changeFrequency: "weekly", priority: 0.85,
  }));
  const toolPages: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${env.SITE_URL}/tools/${t.slug}`,
    lastModified: t.updatedAt,
    changeFrequency: "weekly", priority: 0.8,
  }));
  const workflowPages: MetadataRoute.Sitemap = workflows.map((w) => ({
    url: `${env.SITE_URL}/workflows/${w.slug}`,
    lastModified: w.updatedAt,
    changeFrequency: "monthly", priority: 0.75,
  }));
  const startupPages: MetadataRoute.Sitemap = startups.map((s) => ({
    url: `${env.SITE_URL}/startups/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly", priority: 0.75,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...opportunityPages,
    ...toolPages,
    ...workflowPages,
    ...startupPages,
    ...dynamic,
  ];
}
