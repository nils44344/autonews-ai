import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { scoreTier } from "@/lib/opportunity-score";

// Pillar 1 — Opportunities. The index page is intentionally ranked by
// opportunityScore (not recency) so the strongest plays float to the top. The
// goal: a visitor should see "what should I build / what should I do next" in
// the first scroll, not "what happened today" (that's /blog and /).
export const revalidate = 300;

export const metadata: Metadata = {
  title: "AI Opportunities — discover what to build before everyone else",
  description:
    "Curated AI opportunities ranked by demand, growth, competition, and monetization. Find your next business, automation, or creator play.",
  openGraph: { type: "website" },
};

const KIND_LABELS: Record<string, string> = {
  BUSINESS: "Business",
  STARTUP: "Startup",
  AUTOMATION: "Automation",
  CREATOR: "Creator",
  AGENCY: "Agency",
  NICHE: "Niche",
  MONETIZATION: "Monetization",
};

export default async function OpportunitiesIndex() {
  const items = await safe(
    prisma.opportunity.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ opportunityScore: "desc" }, { publishedAt: "desc" }],
      take: 60,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        kind: true,
        opportunityScore: true,
        demandScore: true,
        growthScore: true,
        competitionScore: true,
        publishedAt: true,
      },
    }),
    [] as {
      id: string;
      slug: string;
      title: string;
      summary: string;
      kind: string;
      opportunityScore: number;
      demandScore: number;
      growthScore: number;
      competitionScore: number;
      publishedAt: Date | null;
    }[],
  );

  return (
    <div className="space-y-10">
      {/* Hero — positions the pillar without redesigning the whole site. */}
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 md:p-12">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live intelligence
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            AI Opportunities, before everyone else.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 md:text-lg">
            Curated, ranked, and scored by demand, growth, competition, and monetization potential.
            Stop reading what happened. Start building what&apos;s next.
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <section>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
              {items.length} active opportunit{items.length === 1 ? "y" : "ies"}
            </h2>
            <span className="text-xs uppercase tracking-wider text-slate-500">
              Ranked by Opportunity Score
            </span>
          </div>

          <ul className="grid gap-5 md:grid-cols-2">
            {items.map((o) => {
              const tier = scoreTier(o.opportunityScore);
              return (
                <li
                  key={o.id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {KIND_LABELS[o.kind] ?? o.kind}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold uppercase ${tier.color}`}>
                        {tier.label}
                      </span>
                      <span className="font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {o.opportunityScore.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/opportunities/${o.slug}`}
                    className="font-display text-xl font-bold leading-snug text-slate-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300"
                  >
                    {o.title}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">
                    {o.summary}
                  </p>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <Metric label="Demand" v={o.demandScore} />
                    <Metric label="Growth" v={o.growthScore} />
                    <Metric label="Competition" v={o.competitionScore} invert />
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Metric({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  // For competition, lower is better — flip the color logic.
  const good = invert ? v < 40 : v >= 70;
  const ok = invert ? v < 65 : v >= 50;
  const color = good
    ? "text-emerald-600 dark:text-emerald-400"
    : ok
      ? "text-amber-600 dark:text-amber-400"
      : "text-slate-500";
  return (
    <div className="rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-800/60">
      <dt className="text-[10px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`font-semibold tabular-nums ${color}`}>{v.toFixed(0)}</dd>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
        Opportunities are being curated.
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        The intelligence engine is collecting signals from your news stream. First batch lands within 24 hours.
      </p>
    </div>
  );
}
