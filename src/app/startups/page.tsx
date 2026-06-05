import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";

// Pillar 5 — Startup Radar.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Startup Radar — who's breaking out",
  description: "Curated AI startups with momentum scores, funding history, and breakout signals.",
};

const STAGE_LABEL: Record<string, string> = {
  PRESEED: "Pre-seed", SEED: "Seed", SERIES_A: "Series A", SERIES_B: "Series B",
  SERIES_C_PLUS: "Series C+", PUBLIC: "Public", ACQUIRED: "Acquired", BOOTSTRAPPED: "Bootstrapped",
};

export default async function StartupsIndex() {
  const items = await safe(
    prisma.startup.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ momentumScore: "desc" }, { lastRoundDate: "desc" }],
      take: 60,
    }),
    [] as Awaited<ReturnType<typeof prisma.startup.findMany>>,
  );

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 md:p-12">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> Breakouts
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            Startups worth watching, before they're obvious.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 md:text-lg">
            Curated AI startups with momentum, funding, and breakout signals. India-aware.
          </p>
        </div>
      </section>

      <ul className="grid gap-5 md:grid-cols-2">
        {items.map((s) => (
          <li key={s.id}
            className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-rose-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-700">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {STAGE_LABEL[s.stage] ?? s.stage}
                </span>
                {s.isBreakout && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Breakout
                  </span>
                )}
              </div>
              <span className="font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {s.momentumScore.toFixed(0)}
              </span>
            </div>
            <Link href={`/startups/${s.slug}`}
              className="font-display text-xl font-bold text-slate-900 group-hover:text-rose-700 dark:text-white dark:group-hover:text-rose-300">
              {s.name}
            </Link>
            {s.hq && <div className="text-xs text-slate-500">{s.hq}</div>}
            <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{s.tagline}</p>
            {s.totalRaisedUsd && s.totalRaisedUsd > 0 && (
              <div className="mt-3 text-xs text-slate-500">
                Total raised: <span className="font-bold text-emerald-600 dark:text-emerald-400">${s.totalRaisedUsd.toFixed(0)}M</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
