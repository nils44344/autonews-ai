import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { AsciiRule } from "@/components/AsciiRule";

// Pillar 2 — Signals. Distinct template: top "Last 24h" velocity stat block,
// then HOT NOW carousel, then full feed. Different visual rhythm from
// Opportunities (radar+cards), Tools (tiers), etc.

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

  const last24 = items.filter((s) => Date.now() - s.observedAt.getTime() < 24 * 3600_000);
  const totalMomentum = last24.reduce((a, s) => a + s.momentumScore, 0);
  const hotCount = items.filter((s) => s.isHot).length;
  const hotNow = items.filter((s) => s.isHot).slice(0, 3);
  const rest = items.filter((s) => !s.isHot || !hotNow.find((h) => h.id === s.id));

  // Kind breakdown
  const byKind: Record<string, number> = {};
  for (const s of items) byKind[s.kind] = (byKind[s.kind] ?? 0) + 1;
  const topKinds = Object.entries(byKind).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-14">
      {/* Distinct opener — terminal-style "velocity dashboard" */}
      <section className="relative -mx-5 -mt-10 border-b border-canvas-rule px-5 pb-12 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:pt-14">
        <div className="absolute inset-0 -z-10 grid-bg opacity-90" />
        <div className="mx-auto max-w-content">
          <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-signal">
            [ PILLAR · 02 / 06 · LIVE FEED ]
          </div>
          <h1 className="mt-4 font-display text-[2.6rem] font-normal italic leading-[1.02] text-[color:rgb(var(--fg))] md:text-[3.6rem]">
            What&apos;s moving the market.
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[color:rgb(var(--muted-fg))]">
            Launches, funding, growth bursts, viral moments. Auto-extracted from every news cycle and ranked by momentum. Refresh in {Math.max(1, 4 - Math.floor(((Date.now() % (4 * 3600_000)) / 3600_000)))}h.
          </p>

          {/* Velocity stat strip — distinctive bar of mono numerals */}
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Last 24h" value={last24.length.toString()} sub="signals captured" />
            <Stat label="Σ Momentum" value={totalMomentum.toString()} sub="total intensity" accent="text-signal" />
            <Stat label="HOT" value={hotCount.toString()} sub="momentum ≥ 80" accent="text-accent" />
            <Stat label="Now" value={items.length.toString()} sub="active in feed" />
          </div>

          {/* Kind breakdown — mini horizontal chart */}
          {topKinds.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">BY TYPE</span>
              {topKinds.map(([k, n]) => (
                <span key={k} className="rounded border border-canvas-rule bg-canvas-raised px-2 py-1 font-mono text-[10px] uppercase tracking-wider">
                  <span className="text-signal">{KIND[k] ?? k}</span>
                  <span className="ml-1 text-[color:rgb(var(--muted-fg))]">{n}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOT NOW — 3-up card carousel, distinct from the full feed below */}
      {hotNow.length > 0 && (
        <section className="mx-auto max-w-content">
          <div className="mb-5 flex items-center justify-between border-b border-canvas-rule pb-3">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-accent">[ HOT · NOW ]</div>
              <h2 className="mt-1 font-display text-[22px] italic text-[color:rgb(var(--fg))]">Trade these first.</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {hotNow.map((s) => (
              <Link key={s.id} href={s.toolSlug ? `/tools/${s.toolSlug}` : s.startupSlug ? `/startups/${s.startupSlug}` : "/signals"}
                className="card card-hover edge-glow group relative overflow-hidden p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-signal/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-bracket text-signal">
                    [{KIND[s.kind] ?? s.kind}]
                  </span>
                  <span className="font-display text-[2rem] italic leading-none text-accent tnum">+{s.momentumScore.toFixed(0)}</span>
                </div>
                <h3 className="mt-4 font-display text-[18px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand">
                  {s.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-[12px] text-[color:rgb(var(--muted-fg))]">{s.summary}</p>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">
                  {s.sourceLabel ?? "—"} · {rel(s.observedAt)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* Full feed — ledger rows */}
      <section className="mx-auto max-w-content">
        <div className="mb-5 flex items-end justify-between border-b border-canvas-rule pb-3">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">[ FEED · {rest.length} ]</div>
            <h2 className="mt-1 font-display text-[22px] italic text-[color:rgb(var(--fg))]">Everything else moving.</h2>
          </div>
        </div>
        <div className="card divide-y divide-canvas-rule overflow-hidden">
          {rest.map((s) => (
            <Link key={s.id} href={s.toolSlug ? `/tools/${s.toolSlug}` : s.startupSlug ? `/startups/${s.startupSlug}` : "/signals"}
              className="ledger-row group grid-cols-[80px_1fr_auto_60px_30px]">
              <span className="rounded bg-canvas-elevated px-1.5 py-0.5 text-center font-mono text-[10px] font-bold uppercase tracking-bracket text-signal">
                {KIND[s.kind] ?? s.kind}
              </span>
              <div className="min-w-0">
                <div className="font-display text-[15px] italic text-[color:rgb(var(--fg))] line-clamp-1 group-hover:text-brand">{s.title}</div>
                <div className="mt-0.5 line-clamp-1 text-[12px] text-[color:rgb(var(--muted-fg))]">{s.summary}</div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">{rel(s.observedAt)}</span>
              <span className="text-right font-mono text-[14px] font-bold tabular-nums tnum text-signal">+{s.momentumScore.toFixed(0)}</span>
              <span className="font-mono text-[10px] text-[color:rgb(var(--muted-fg))] group-hover:text-brand">→</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub, accent = "text-[color:rgb(var(--fg))]" }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">[{label}]</div>
      <div className={`mt-1 font-display text-[2rem] italic leading-none tabular-nums tnum ${accent}`}>{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">{sub}</div>
    </div>
  );
}
