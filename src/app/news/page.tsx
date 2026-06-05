import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { PillarHero } from "@/components/PillarHero";

// Pillar 6 — News (lowest visual priority per the hierarchy rule).
export const revalidate = 180;

export const metadata: Metadata = {
  title: "AI & Tech News — high-signal updates",
  description: "AI, startups, markets, and tech news. Filtered for what actually moves opportunity.",
};

type LatestRow = {
  id: string; slug: string; title: string; dek: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
};
type TrendingRow = { slug: string; title: string; type: "NEWS" | "BLOG" };

export default async function NewsHub() {
  const [latest, trending] = await Promise.all([
    safe<LatestRow[]>(
      prisma.article.findMany({
        where: { status: "PUBLISHED", type: "NEWS" },
        orderBy: { publishedAt: "desc" },
        take: 40,
        select: {
          id: true, slug: true, title: true, dek: true, publishedAt: true,
          category: { select: { name: true, slug: true } },
        },
      }) as Promise<LatestRow[]>,
      [],
    ),
    safe<TrendingRow[]>(
      prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: new Date(Date.now() - 7 * 24 * 3600_000) },
        },
        orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
        take: 5,
        select: { slug: true, title: true, type: true },
      }) as Promise<TrendingRow[]>,
      [],
    ),
  ]);

  return (
    <div className="space-y-10">
      <PillarHero
        kicker="Pillar 6"
        title="AI &amp; Tech News."
        subtitle="Curated tech, AI, startup, and market news. We surface what changes opportunity, and skip the rest."
        accent="slate"
      />

      {trending.length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Trending this week</h2>
          <ul className="flex flex-wrap gap-2">
            {trending.map((t) => (
              <li key={t.slug}>
                <Link href={`/${t.type === "BLOG" ? "blog" : "article"}/${t.slug}`}
                  className="rounded-full border border-slate-800 bg-canvas-raised px-3 py-1.5 text-[13px] text-slate-300 hover:border-slate-600 hover:text-white">
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-6 font-display text-xl font-bold text-white">Latest</h2>
        <ul className="grid gap-4 md:grid-cols-2">
          {latest.map((a) => (
            <li key={a.id} className="card card-hover group p-5">
              {a.category?.name && (
                <span className="mb-1 inline-block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {a.category.name}
                </span>
              )}
              <Link href={`/article/${a.slug}`}
                className="block font-display text-[15px] font-semibold leading-snug text-white group-hover:text-opportunity">
                {a.title}
              </Link>
              {a.dek && <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{a.dek}</p>}
              {a.publishedAt && (
                <time className="mt-3 block text-[11px] text-slate-500">
                  {new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </time>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
