import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { safe } from "@/lib/safe";

// Dynamic XML sitemap — Next.js serves this at /sitemap.xml automatically.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await safe(
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, type: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 5000,
    }),
    [] as { slug: string; type: "NEWS" | "BLOG"; updatedAt: Date; publishedAt: Date | null }[],
  );

  const staticPages: MetadataRoute.Sitemap = [
    { url: env.SITE_URL, changeFrequency: "hourly", priority: 1 },
    { url: `${env.SITE_URL}/blog`, changeFrequency: "daily", priority: 0.8 },
    { url: `${env.SITE_URL}/memes`, changeFrequency: "daily", priority: 0.5 },
  ];

  const dynamic: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${env.SITE_URL}/${a.type === "BLOG" ? "blog" : "article"}/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: a.type === "BLOG" ? "weekly" : "daily",
    priority: a.type === "BLOG" ? 0.6 : 0.7,
  }));

  return [...staticPages, ...dynamic];
}
