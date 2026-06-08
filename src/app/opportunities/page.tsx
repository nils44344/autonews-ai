import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { scoreTier } from "@/lib/opportunity-score";
import { PillarHero } from "@/components/PillarHero";

// Pillar 1 — Opportunities. Painted in the new "opportunity = purple" accent.
// Sort: opportunityScore desc so strongest plays float to the top.

export const revalidate = 300;

export const metadata: Metadata = {
  // Title kept under 60 chars so the "| AutoNews AI" template doesn't push us
  // past Google's display cutoff (audit flagged old title at 76 chars).
  title: "AI Opportunities — what to build next",
  description:
    "Curated AI opportunities ranked by demand, growth, competition, and monetization. Find your next business, automation, or creator play.",
  alternates: { canonical: "/opportunities" },
  openGraph: { type: "website" },
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

  return (
    <div className="space-y-12">
      <PillarHero
        kicker="Pillar 1"
        title="AI Opportunities, before everyone else."
        subtitle="Curated and ranked by demand, growth, competition, and monetization. Stop reading. Start building."
        accent="opportunity"
      />

      {items.length === 0 ? (
        <Empty />
      ) : (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-xl font-bold text-white">
              {items.length} active opportunit{items.length === 1 ? "y" : "ies"}
            </h2>
            <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">By Opportunity Score</span>
          </div>
          <ul className="grid gap-5 md:grid-cols-2">
            {items.map((o) => {
              const tier = scoreTier(o.opportunityScore);
              return (
                <li key={o.id} className="card card-hover group p-6">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-opportunity/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-opportunity">
                      {KIND[o.kind] ?? o.kind}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-[10px] font-bold uppercase ${tier.color}`}>{tier.label}</span>
                      <span className="font-display text-2xl font-extrabold tabular-nums text-white">
                        {o.opportunityScore.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <Link href={`/opportunities/${o.slug}`}
                    className="font-display text-lg font-bold leading-snug text-white group-hover:text-opportunity">
                    {o.title}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-[13px] text-slate-400">{o.summary}</p>
                  <div className="mt-4 grid grid-cols-3 gap-1.5">
                    <Mini label="Demand" v={o.demandScore} />
                    <Mini label="Growth" v={o.growthScore} />
                    <Mini label="Competition" v={o.competitionScore} invert />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Mini({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  const good = invert ? v < 40 : v >= 70;
  const ok = invert ? v < 65 : v >= 50;
  const c = good ? "text-growth" : ok ? "text-warning" : "text-slate-500";
  return (
    <div className="rounded bg-canvas-elevated px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-[12px] font-semibold tabular-nums ${c}`}>{v.toFixed(0)}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="card rounded-2xl p-10 text-center">
      <h2 className="font-display text-xl font-bold text-white">Opportunities are being curated.</h2>
      <p className="mt-2 text-sm text-slate-400">First batch lands within 24 hours.</p>
    </div>
  );
}

