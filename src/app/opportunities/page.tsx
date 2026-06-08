import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { scoreTier } from "@/lib/opportunity-score";
import { OpportunityRadar } from "@/components/OpportunityRadar";
import { AsciiRule } from "@/components/AsciiRule";

// Pillar 1 — Opportunities. Distinct from every other pillar: leads with the
// quadrant breakdown + a mini radar. Card grid below uses two-column editorial
// rhythm. No shared <PillarHero/> here so the page is its own thing for SEO.

export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Opportunities — what to build next",
  description:
    "Curated AI opportunities ranked by demand, growth, competition, and monetization. Find your next business, automation, or creator play.",
  alternates: { canonical: "/opportunities" },
};

const KIND: Record<string, string> = {
  BUSINESS: "Business", STARTUP: "Startup", AUTOMATION: "Automation",
  CREATOR: "Creator", AGENCY: "Agency", NICHE: "Niche", MONETIZATION: "Monetization",
};

export default async function OpportunitiesIndex() {
  const items = await safe(
    prisma.opportunity.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ opportunityScore: "desc" }, { publishedAt: "desc" }],
      take: 60,
      select: {
        id: true, slug: true, title: true, summary: true, kind: true,
        opportunityScore: true, demandScore: true, growthScore: true, competitionScore: true,
      },
    }),
    [] as Awaited<ReturnType<typeof prisma.opportunity.findMany>>,
  );

  // Quadrant counts — distinct opener no other pillar has.
  const hot = items.filter((o) => o.demandScore >= 50 && o.growthScore >= 50).length;
  const emerging = items.filter((o) => o.demandScore < 50 && o.growthScore >= 50).length;
  const mature = items.filter((o) => o.demandScore >= 50 && o.growthScore < 50).length;
  const wait = items.filter((o) => o.demandScore < 50 && o.growthScore < 50).length;

  return (
    <div className="space-y-14">
      {/* Distinct opener — editorial title + quadrant stats + mini radar */}
      <section className="relative -mx-5 -mt-10 grid gap-10 border-b border-canvas-rule px-5 pb-12 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:grid-cols-[1.1fr_1fr] md:pt-14">
        <div className="absolute inset-0 -z-10 grid-bg opacity-90" />
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">
            [ PILLAR · 01 / 06 ]
          </div>
          <h1 className="mt-4 font-display text-[2.6rem] font-normal italic leading-[1.02] text-[color:rgb(var(--fg))] md:text-[3.6rem]">
            Opportunities, mapped.
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[color:rgb(var(--muted-fg))]">
            Every opportunity scored on demand, growth, competition, and monetisation. Plotted so you see the shape of the market at a glance, then drill into the play that fits you.
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 md:max-w-md">
            <QuadStat label="HOT"      sub="high demand × growth" v={hot}      accent="text-brand" />
            <QuadStat label="EMERGING" sub="low demand × growth"  v={emerging} accent="text-accent" />
            <QuadStat label="MATURE"   sub="high demand × flat"   v={mature}   accent="text-[color:rgb(var(--muted-fg))]" />
            <QuadStat label="WAIT"     sub="low demand × flat"    v={wait}     accent="text-[color:rgb(var(--muted-fg))]" />
          </div>
        </div>

        <div className="card edge-glow relative overflow-hidden p-3 md:p-4">
          <div className="mb-1 flex items-center justify-between px-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">[ RADAR · LIVE ]</span>
            <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">DEMAND × GROWTH × SCORE</span>
          </div>
          <OpportunityRadar items={items.slice(0, 12)} />
        </div>
      </section>

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* Editorial section header */}
      <section className="mx-auto max-w-content">
        <div className="mb-6 flex items-end justify-between border-b border-canvas-rule pb-3">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">[ ALL · {items.length} ACTIVE ]</div>
            <h2 className="mt-1 font-display text-[26px] italic leading-none text-[color:rgb(var(--fg))]">Every play, ranked.</h2>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">Sorted by Opportunity Score</span>
        </div>

        {items.length === 0 ? (
          <Empty />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2">
            {items.map((o, i) => {
              const tier = scoreTier(o.opportunityScore);
              return (
                <li key={o.id} className={`card card-hover group p-6 ${i % 4 === 0 ? "md:col-span-2" : ""}`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span className="rounded bg-opportunity/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-bracket text-opportunity">
                      [{KIND[o.kind] ?? o.kind}]
                    </span>
                    <div className="text-right">
                      <div className="font-display text-[28px] italic leading-none text-brand tnum">
                        {o.opportunityScore.toFixed(0)}
                      </div>
                      <div className={`mt-0.5 font-mono text-[9px] font-bold uppercase tracking-bracket ${tier.color}`}>
                        {tier.label}
                      </div>
                    </div>
                  </div>
                  <Link href={`/opportunities/${o.slug}`}
                    className="font-display text-[20px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand">
                    {o.title}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-[13px] text-[color:rgb(var(--muted-fg))]">{o.summary}</p>
                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    <Mini label="Demand" v={o.demandScore} />
                    <Mini label="Growth" v={o.growthScore} />
                    <Mini label="Comp" v={o.competitionScore} invert />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuadStat({ label, sub, v, accent }: { label: string; sub: string; v: number; accent: string }) {
  return (
    <div className="card p-4">
      <div className={`font-mono text-[10px] font-bold uppercase tracking-bracket ${accent}`}>[{label}]</div>
      <div className="mt-1 font-display text-[2rem] italic leading-none tabular-nums tnum text-[color:rgb(var(--fg))]">{v}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">{sub}</div>
    </div>
  );
}

function Mini({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  const good = invert ? v < 40 : v >= 70;
  const ok = invert ? v < 65 : v >= 50;
  const c = good ? "text-growth" : ok ? "text-accent" : "text-[color:rgb(var(--muted-fg))]";
  return (
    <div className="rounded bg-canvas-elevated px-2 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">{label}</div>
      <div className={`font-mono text-[12px] font-bold tabular-nums tnum ${c}`}>{v.toFixed(0)}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="card p-10 text-center">
      <h2 className="font-display text-[22px] italic text-[color:rgb(var(--fg))]">Opportunities being curated.</h2>
      <p className="mt-2 text-sm text-[color:rgb(var(--muted-fg))]">First batch lands within 24 hours.</p>
    </div>
  );
}
