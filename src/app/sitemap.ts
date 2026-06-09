import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { TOP_BRANDS } from "@/lib/brands";
import { CATEGORIES } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pull the latest update time per brand so lastModified is accurate
  const brandUpdates = await prisma.brand.findMany({
    select: { slug: true, updatedAt: true },
  }).catch(() => []);
  const updateMap = new Map(brandUpdates.map((b) => [b.slug, b.updatedAt]));

  const staticPages: MetadataRoute.Sitemap = [
    { url: env.SITE_URL, changeFrequency: "hourly", priority: 1, lastModified: new Date() },
  ];

  const trendPages: MetadataRoute.Sitemap = TOP_BRANDS.map((b) => ({
    url: `${env.SITE_URL}/trends/${b.slug}`,
    lastModified: updateMap.get(b.slug) ?? new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const predictionPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${env.SITE_URL}/predictions/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.85,
  }));

  return [...staticPages, ...trendPages, ...predictionPages];
}
