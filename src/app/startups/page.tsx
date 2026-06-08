import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { Sparkline } from "@/components/Sparkline";
import { AsciiRule } from "@/components/AsciiRule";

// Pillar 5 — Startup Radar. Distinct template: FUNDING DASHBOARD opener
// (total raised, breakouts, stage breakdown), then breakout grid + ledger.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Startup Radar — who's breaking out",
  description: "Curated AI startups with momentum scores, funding history, breakout flags, and stage breakdown. India-aware coverage.",
  alternates: { canonical: "/startups" },
};

const STAGE_LABEL: Record<string, string> = {
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

  const totalRaised = items.reduce((a, s) => a + (s.totalRaisedUsd ?? 0), 0);
  const breakouts = items.filter((s) => s.isBreakout);
  const rest = items.filter((s) => !s.isBreakout);
  // Stage breakdown
  const stages: Record<string, number> = {};
  for (const s of items) stages[s.stage] = (stages[s.stage] ?? 0) + 1;
  const topStages = Object.entries(stages).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-14">
      {/* Funding dashboard opener */}
      <section className="relative -mx-5 -mt-10 border-b border-canvas-rule px-5 pb-12 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:pt-14">
        <div className="absolute inset-0 -z-10 grid-bg opacity-90" />
        <div className="mx-auto max-w-content">
          <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-startup">
            [ PILLAR · 05 / 06 · RADAR ]
          </div>
          <h1 className="mt-4 font-display text-[2.6rem] font-normal italic leading-[1.02] text-[color:rgb(var(--fg))] md:text-[3.6rem]">
            The startups worth tracking.
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[color:rgb(var(--muted-fg))]">
            Curated AI companies with momentum scores, funding history, and breakout flags. India-aware — we surface what builders in this market actually need to know.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Tracked"   value={items.length.toString()}              sub="active startups" />
            <Stat label="Breakouts" value={breakouts.length.toString()}          sub="high momentum"   accent="text-startup" />
            <Stat label="Raised"    value={`$${(totalRaised / 1000).toFixed(1)}B`} sub="cumulative funding" accent="text-growth" />
            <Stat label="Stages"    value={Object.keys(stages).length.toString()} sub="distinct" />
          </div>

          {topStages.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">BY STAGE</span>
              {topStages.map(([s, n]) => (
                <span key={s} className="rounded border border-canvas-rule bg-canvas-raised px-2 py-1 font-mono text-[10px] uppercase tracking-wider">
                  <span className="text-startup">{STAGE_LABEL[s] ?? s}</span>
                  <span className="ml-1 text-[color:rgb(var(--muted-fg))]">{n}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* Breakouts — distinct card grid */}
      {breakouts.length > 0 && (
        <section className="mx-auto max-w-content">
          <div className="mb-4 flex items-end justify-between border-b border-canvas-rule pb-3">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-startup">[ BREAKOUTS · {breakouts.length} ]</div>
              <h2 className="mt-1 font-display text-[22px] italic text-[color:rgb(var(--fg))]">Highest momentum, right now.</h2>
            </div>
          </div>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {breakouts.map((s) => (
              <li key={s.id} className="card card-hover edge-glow group relative overflow-hidden p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-startup/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-bracket text-startup">[BREAKOUT]</span>
                  <span className="font-display text-[2rem] italic leading-none text-startup tnum">{s.momentumScore.toFixed(0)}</span>
                </div>
                <Link href={`/startups/${s.slug}`}
                  className="mt-3 block font-display text-[20px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand">
                  {s.name}
                </Link>
                {s.hq && <div className="text-[11px] text-[color:rgb(var(--muted-fg))]">{s.hq}</div>}
                <p className="mt-2 line-clamp-2 text-[13px] text-[color:rgb(var(--muted-fg))]">{s.tagline}</p>
                {s.totalRaisedUsd ? (
                  <div className="mt-3 font-mono text-[11px] uppercase tracking-bracket text-growth">
                    Raised ${s.totalRaisedUsd.toFixed(0)}M
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* Rest — ledger */}
      <section className="mx-auto max-w-content">
        <div className="mb-4 flex items-end justify-between border-b border-canvas-rule pb-3">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">[ TRACKED · {rest.length} ]</div>
            <h2 className="mt-1 font-display text-[22px] italic text-[color:rgb(var(--fg))]">Everyone else on the radar.</h2>
          </div>
        </div>
        <div className="card divide-y divide-canvas-rule overflow-hidden">
          {rest.map((s) => (
            <Link key={s.id} href={`/startups/${s.slug}`}
              className="ledger-row group grid-cols-[1fr_70px_auto_100px_60px_30px]">
              <div className="min-w-0">
                <div className="font-display text-[16px] italic text-[color:rgb(var(--fg))] group-hover:text-brand">{s.name}</div>
                <div className="mt-0.5 line-clamp-1 text-[12px] text-[color:rgb(var(--muted-fg))]">{s.tagline}</div>
              </div>
              <span className="text-right font-mono text-[10px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">{STAGE_LABEL[s.stage] ?? s.stage}</span>
              <span className="text-right font-mono text-[10px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">{s.hq ?? "—"}</span>
              <span className="text-startup">
                <Sparkline score={s.momentumScore} seed={s.slug} color="rgb(251 113 133)" />
              </span>
              <span className="text-right font-mono text-[14px] font-bold tabular-nums tnum text-startup">{s.momentumScore.toFixed(0)}</span>
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
