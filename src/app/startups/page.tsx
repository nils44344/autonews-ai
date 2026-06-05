import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { PillarHero } from "@/components/PillarHero";

// Pillar 5 — Startup Radar. Amber accent.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Startup Radar — who's breaking out",
  description: "Curated AI startups with momentum scores, funding history, and breakout signals.",
};

const STAGE: Record<string, string> = {
  PRESEED: "Pre-seed", SEED: "Seed", SERIES_A: "Series A", SERIES_B: "Series B",
  SERIES_C_PLUS: "Series C+", PUBLIC: "Public", ACQUIRED: "Acquired", BOOTSTRAPPED: "Bootstrapped",
};

export default async function StartupsIndex() {
  const items = await safe(
    prisma.startup.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isBreakout: "desc" }, { momentumScore: "desc" }],
      take: 60,
    }),
    [] as Awaited<ReturnType<typeof prisma.startup.findMany>>,
  );

  return (
    <div className="space-y-10">
      <PillarHero
        kicker="Pillar 5 · Breakouts"
        title="Startups worth watching, before they're obvious."
        subtitle="Curated AI startups with momentum, funding, and breakout signals. India-aware."
        accent="startup"
      />

      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <li key={s.id} className="card card-hover group p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {s.isBreakout && (
                  <span className="rounded bg-startup/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-startup">
                    Breakout
                  </span>
                )}
                <span className="rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                  {STAGE[s.stage] ?? s.stage}
                </span>
              </div>
              <span className="font-display text-xl font-extrabold tabular-nums text-startup">
                {s.momentumScore.toFixed(0)}
              </span>
            </div>
            <Link href={`/startups/${s.slug}`}
              className="font-display text-lg font-bold text-white group-hover:text-startup">
              {s.name}
            </Link>
            {s.hq && <div className="text-[11px] text-slate-500">{s.hq}</div>}
            <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{s.tagline}</p>
            {s.totalRaisedUsd && s.totalRaisedUsd > 0 && (
              <div className="mt-3 text-[11px] text-slate-500">
                Raised <span className="font-bold text-growth">${s.totalRaisedUsd.toFixed(0)}M</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
