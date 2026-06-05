import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";

// Pillar 2 — AI Signals. Live intelligence feed: what's exploding right now.
// v1: curated entries. v2 will replace this with automated PH/HN/GitHub/Reddit
// scrapers that auto-promote signals when momentum thresholds are crossed.
export const revalidate = 120;

export const metadata: Metadata = {
  title: "AI Signals — what's exploding right now",
  description: "Live intelligence feed of AI launches, funding, growth bursts, and viral moments. Ranked by momentum.",
};

const KIND_LABEL: Record<string, string> = {
  LAUNCH: "Launch", FUNDING: "Funding", GROWTH: "Growth",
  VIRAL_POST: "Viral", RESEARCH: "Research", HIRING: "Hiring", ACQUISITION: "Acquisition",
};

function rel(d: Date): string {
  const h = (Date.now() - d.getTime()) / 3600_000;
  if (h < 1) return `${Math.round(h * 60)}m ago`;
  if (h < 24) return `${h.toFixed(0)}h ago`;
  return `${(h / 24).toFixed(0)}d ago`;
}

export default async function SignalsFeed() {
  const items = await safe(
    prisma.signal.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isHot: "desc" }, { momentumScore: "desc" }, { observedAt: "desc" }],
      take: 100,
    }),
    [] as Awaited<ReturnType<typeof prisma.signal.findMany>>,
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 md:p-12">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-700 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" /> Live
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            What's exploding right now.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 md:text-lg">
            Live AI signals: launches, funding, growth bursts, viral moments. Ranked by momentum.
          </p>
        </div>
      </section>

      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id}
            className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-700">
            <div className="flex w-14 shrink-0 flex-col items-center">
              <div className="font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {s.momentumScore.toFixed(0)}
              </div>
              <div className="text-[9px] uppercase tracking-wider text-slate-500">momentum</div>
            </div>
            <div className="flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider">
                <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                  {KIND_LABEL[s.kind] ?? s.kind}
                </span>
                {s.isHot && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 font-bold text-white">HOT</span>
                )}
                <span className="text-slate-500">{s.sourceLabel ?? "—"}</span>
                <span className="text-slate-400">· {rel(s.observedAt)}</span>
              </div>
              <h3 className="font-display text-lg font-bold leading-snug text-slate-900 dark:text-white">
                {s.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{s.summary}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {s.toolSlug && (
                  <Link href={`/tools/${s.toolSlug}`} className="text-sky-600 hover:underline dark:text-sky-400">
                    → tool: {s.toolSlug}
                  </Link>
                )}
                {s.startupSlug && (
                  <Link href={`/startups/${s.startupSlug}`} className="text-rose-600 hover:underline dark:text-rose-400">
                    → startup: {s.startupSlug}
                  </Link>
                )}
                {s.opportunitySlug && (
                  <Link href={`/opportunities/${s.opportunitySlug}`} className="text-emerald-600 hover:underline dark:text-emerald-400">
                    → opportunity: {s.opportunitySlug}
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
