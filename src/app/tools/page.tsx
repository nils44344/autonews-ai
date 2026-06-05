import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";

// Pillar 3 — Tools. Editorial AI tool registry, ranked by momentum. NEVER a
// passive directory: every entry has "why this matters" + "what opportunity
// it unlocks". Comparison pages come in v2 (need 100+ tools to be useful).
export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Tools — what to use, what's growing fastest",
  description:
    "Curated AI tools with editorial context. Rankings, momentum scores, and the opportunity each one unlocks.",
};

const PRICING_LABEL: Record<string, string> = {
  FREE: "Free", FREEMIUM: "Freemium", PAID: "Paid",
  SUBSCRIPTION: "Subscription", USAGE: "Usage-based", ENTERPRISE: "Enterprise",
};

export default async function ToolsIndex() {
  const tools = await safe(
    prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ momentumScore: "desc" }, { popularityScore: "desc" }],
      take: 100,
      select: {
        id: true, slug: true, name: true, tagline: true, vendor: true,
        categories: true, pricing: true, momentumScore: true, trendingScore: true,
        popularityScore: true, ranking: true,
      },
    }),
    [] as Awaited<ReturnType<typeof prisma.tool.findMany>>,
  );

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 md:p-12">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" /> Ranked weekly
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            AI Tools that actually matter.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 md:text-lg">
            Editorial picks, momentum scores, and what each tool unlocks for builders, creators, and operators.
          </p>
        </div>
      </section>

      {tools.length === 0 ? (
        <EmptyState />
      ) : (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {tools.length} tracked
            </h2>
            <span className="text-xs uppercase tracking-wider text-slate-500">By momentum</span>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((t) => (
              <li key={t.id}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  {t.ranking && (
                    <span className="font-display text-xs font-bold text-slate-400">#{t.ranking}</span>
                  )}
                  <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {PRICING_LABEL[t.pricing] ?? t.pricing}
                  </span>
                </div>
                <Link href={`/tools/${t.slug}`}
                  className="font-display text-xl font-extrabold text-slate-900 group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300">
                  {t.name}
                </Link>
                {t.vendor && <div className="text-xs text-slate-500">{t.vendor}</div>}
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{t.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.categories.slice(0, 3).map((c) => (
                    <span key={c} className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                  <Score label="Momentum" v={t.momentumScore} color="emerald" />
                  <Score label="Trending" v={t.trendingScore} color="amber" />
                  <Score label="Popular" v={t.popularityScore} color="sky" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Score({ label, v, color }: { label: string; v: number; color: "emerald" | "amber" | "sky" }) {
  const txt = { emerald: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", sky: "text-sky-600 dark:text-sky-400" }[color];
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
      <div className="text-[10px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-semibold tabular-nums ${txt}`}>{v.toFixed(0)}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
      <p className="text-slate-500">Tool catalog is being curated.</p>
    </div>
  );
}
