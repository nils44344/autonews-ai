import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { PillarHero } from "@/components/PillarHero";

// Pillar 2 — AI Signals. Live intelligence feed. Accent: signal blue.
export const revalidate = 120;

export const metadata: Metadata = {
  title: "AI Signals — what's exploding right now",
  description: "Live intelligence feed of AI launches, funding, growth bursts, and viral moments. Ranked by momentum.",
  alternates: { canonical: "/signals" },
};

const KIND: Record<string, string> = {
  LAUNCH: "Launch", FUNDING: "Funding", GROWTH: "Growth",
  VIRAL_POST: "Viral", RESEARCH: "Research", HIRING: "Hiring", ACQUISITION: "Acquisition",
};

function rel(d: Date): string {
  const h = (Date.now() - d.getTime()) / 3600_000;
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(0)}h`;
  return `${(h / 24).toFixed(0)}d`;
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
    <div className="space-y-10">
      <PillarHero
        kicker="Pillar 2 · Live"
        title="What's exploding right now."
        subtitle="Launches, funding, growth bursts, viral moments. Ranked by momentum."
        accent="signal"
      />

      <ul className="space-y-3">
        {items.map((s) => (
          <li key={s.id} className="card card-hover group flex items-start gap-4 p-5">
            <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-signal/10 py-2.5">
              <div className="font-display text-xl font-extrabold tabular-nums text-signal">{s.momentumScore.toFixed(0)}</div>
              <div className="text-[9px] uppercase tracking-wider text-signal/70">mtm</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider">
                <span className="rounded bg-signal/15 px-1.5 py-0.5 font-semibold text-signal">{KIND[s.kind] ?? s.kind}</span>
                {s.isHot && <span className="rounded bg-warning/20 px-1.5 py-0.5 font-bold text-warning">HOT</span>}
                <span className="text-slate-500">{s.sourceLabel ?? "—"}</span>
                <span className="text-slate-600">· {rel(s.observedAt)}</span>
              </div>
              <h3 className="font-display text-[15px] font-semibold leading-snug text-white group-hover:text-signal">
                {s.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-[13px] text-slate-400">{s.summary}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                {s.toolSlug && <Link href={`/tools/${s.toolSlug}`} className="text-tool hover:underline">→ tool: {s.toolSlug}</Link>}
                {s.startupSlug && <Link href={`/startups/${s.startupSlug}`} className="text-startup hover:underline">→ startup: {s.startupSlug}</Link>}
                {s.opportunitySlug && <Link href={`/opportunities/${s.opportunitySlug}`} className="text-opportunity hover:underline">→ opportunity: {s.opportunitySlug}</Link>}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
