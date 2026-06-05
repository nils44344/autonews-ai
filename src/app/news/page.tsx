import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";

// Pillar 6 — News. Collapsed from the old homepage feed. Lives at /news so the
// homepage can focus on Opportunities/Signals/Tools/Workflows/Startups. The
// existing /article/[slug] and /category/* routes still work exactly as before.
export const revalidate = 180;

export const metadata: Metadata = {
  title: "AI & Tech News — high-signal updates",
  description: "AI, startups, markets, and tech news. Filtered for what actually moves opportunity.",
};

export default async function NewsHub() {
  type LatestRow = {
    id: string; slug: string; title: string; dek: string | null;
    publishedAt: Date | null;
    category: { name: string; slug: string } | null;
  };
  type TrendingRow = { slug: string; title: string; type: "NEWS" | "BLOG" };

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
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 md:p-12">
        <div className="max-w-3xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            AI & Tech News.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 md:text-lg">
            Curated tech, AI, startup, and market news. We surface what changes opportunity — and skip the rest.
          </p>
        </div>
      </section>

      {trending.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-slate-500">Trending this week</h2>
          <ul className="flex flex-wrap gap-2">
            {trending.map((t) => (
              <li key={t.slug}>
                <Link href={`/${t.type === "BLOG" ? "blog" : "article"}/${t.slug}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-display text-2xl font-bold text-slate-900 dark:text-white">Latest</h2>
        <ul className="grid gap-5 md:grid-cols-2">
          {latest.map((a) => (
            <li key={a.id}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700">
              {a.category?.name && (
                <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {a.category.name}
                </span>
              )}
              <Link href={`/article/${a.slug}`}
                className="font-display text-lg font-bold leading-snug text-slate-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                {a.title}
              </Link>
              {a.dek && <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{a.dek}</p>}
              {a.publishedAt && (
                <time className="mt-3 text-xs text-slate-500">
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
