import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SearchPrompt } from "@/components/SearchPrompt";
import { scoreTier } from "@/lib/opportunity-score";

// Intelligence-dashboard homepage. Above the fold = hero + search + top 3
// opportunities ONLY (brief: "users should immediately understand what matters
// today"). Everything else lives below; sections are far apart so the page
// reads as a designed product, not a feed.

export const revalidate = 120;

type NewsRow = {
  id: string; slug: string; title: string; dek: string | null;
  publishedAt: Date | null;
  category: { name: string } | null;
};

const OPP_KIND: Record<string, string> = {
  BUSINESS: "Business", STARTUP: "Startup", AUTOMATION: "Automation",
  CREATOR: "Creator", AGENCY: "Agency", NICHE: "Niche", MONETIZATION: "Monetization",
};
const SIG_KIND: Record<string, string> = {
  LAUNCH: "Launch", FUNDING: "Funding", GROWTH: "Growth",
  VIRAL_POST: "Viral", RESEARCH: "Research", HIRING: "Hiring", ACQUISITION: "Acquisition",
};

function rel(d: Date): string {
  const h = (Date.now() - d.getTime()) / 3600_000;
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(0)}h`;
  return `${(h / 24).toFixed(0)}d`;
}

export default async function HomePage() {
  const [topOpps, signals, tools, workflows, startups, news] = await Promise.all([
    safe(prisma.opportunity.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { opportunityScore: "desc" },
      take: 3,
      select: { id: true, slug: true, title: true, summary: true, kind: true, opportunityScore: true, growthScore: true, demandScore: true, competitionScore: true },
    }), [] as Awaited<ReturnType<typeof prisma.opportunity.findMany>>),
    safe(prisma.signal.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isHot: "desc" }, { momentumScore: "desc" }],
      take: 5,
      select: { id: true, slug: true, title: true, kind: true, momentumScore: true, isHot: true, observedAt: true, sourceLabel: true },
    }), [] as Awaited<ReturnType<typeof prisma.signal.findMany>>),
    safe(prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { momentumScore: "desc" },
      take: 6,
      select: { id: true, slug: true, name: true, tagline: true, vendor: true, momentumScore: true, ranking: true, categories: true },
    }), [] as Awaited<ReturnType<typeof prisma.tool.findMany>>),
    safe(prisma.workflow.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { popularityScore: "desc" },
      take: 4,
      select: { id: true, slug: true, title: true, kind: true, objective: true, timeSavedHours: true },
    }), [] as Awaited<ReturnType<typeof prisma.workflow.findMany>>),
    safe(prisma.startup.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isBreakout: "desc" }, { momentumScore: "desc" }],
      take: 4,
      select: { id: true, slug: true, name: true, tagline: true, momentumScore: true, isBreakout: true, stage: true, hq: true, totalRaisedUsd: true },
    }), [] as Awaited<ReturnType<typeof prisma.startup.findMany>>),
    safe<NewsRow[]>(prisma.article.findMany({
      where: { status: "PUBLISHED", type: "NEWS" },
      orderBy: { publishedAt: "desc" },
      take: 4,
      select: { id: true, slug: true, title: true, dek: true, publishedAt: true, category: { select: { name: true } } },
    }) as Promise<NewsRow[]>, []),
  ]);

  return (
    <div className="space-y-24 md:space-y-28">
      {/* ─── HERO + SEARCH + TOP OPPORTUNITIES (above the fold) ────────── */}
      <section className="relative -mx-5 -mt-10 overflow-hidden border-b border-slate-900/60 px-5 pb-12 pt-14 sm:-mx-6 sm:px-6 md:-mt-14 md:pb-20 md:pt-24">
        <div className="absolute inset-0 -z-10 grid-bg opacity-90" />
        <div className="mx-auto max-w-content">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-opportunity/30 bg-opportunity/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-opportunity">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-opportunity" />
            AI Intelligence Platform
          </div>
          <h1 className="font-display text-[2.4rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-[4rem]">
            Discover AI opportunities <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-opportunity via-signal to-tool bg-clip-text text-transparent">
              before everyone else.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
            Track opportunities, signals, tools, workflows, and startups in one place. Stop reading what happened. Start building what&apos;s next.
          </p>

          {/* Search prompt — visual CTA into the command palette. */}
          <SearchPrompt />

          {/* Three top opportunities right under the fold. Nothing else. */}
          {topOpps.length > 0 && (
            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {topOpps.map((o) => {
                const tier = scoreTier(o.opportunityScore);
                return (
                  <Link key={o.id} href={`/opportunities/${o.slug}`}
                    className="card card-hover group flex flex-col p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-opportunity/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-opportunity">
                        {OPP_KIND[o.kind] ?? o.kind}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-[10px] font-bold uppercase ${tier.color}`}>{tier.label}</span>
                        <span className="font-display text-2xl font-extrabold tabular-nums text-white">
                          {o.opportunityScore.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-display text-base font-bold leading-snug text-white group-hover:text-opportunity">
                      {o.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{o.summary}</p>
                    <div className="mt-4 grid grid-cols-3 gap-1.5">
                      <Mini label="Demand" v={o.demandScore} />
                      <Mini label="Growth" v={o.growthScore} />
                      <Mini label="Comp" v={o.competitionScore} invert />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── LIVE SIGNALS ────────────────────────────────────────────── */}
      <Section
        kicker="Live"
        title="What's exploding right now"
        href="/signals"
        accent="signal"
      >
        <ul className="grid gap-3">
          {signals.map((s) => (
            <li key={s.id} className="card card-hover group flex items-center gap-4 p-4">
              <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-signal/10 py-2">
                <div className="font-display text-xl font-extrabold tabular-nums text-signal">{s.momentumScore.toFixed(0)}</div>
                <div className="text-[9px] uppercase tracking-wider text-signal/70">mtm</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500">
                  <span className="rounded bg-signal/15 px-1.5 py-0.5 font-semibold text-signal">{SIG_KIND[s.kind] ?? s.kind}</span>
                  {s.isHot && <span className="rounded bg-warning/20 px-1.5 py-0.5 font-bold text-warning">HOT</span>}
                  <span>{s.sourceLabel ?? "—"}</span>
                  <span className="text-slate-600">· {rel(s.observedAt)}</span>
                </div>
                <Link href="/signals" className="font-display text-[15px] font-semibold leading-snug text-white group-hover:text-signal">
                  {s.title}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* ─── FASTEST GROWING TOOLS ───────────────────────────────────── */}
      <Section
        kicker="Tools"
        title="Fastest growing right now"
        href="/tools"
        accent="tool"
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <li key={t.id} className="card card-hover group p-5">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-500">{t.ranking ? `#${String(t.ranking).padStart(2, "0")}` : ""}</span>
                <span className="font-display font-extrabold tabular-nums text-tool">{t.momentumScore.toFixed(0)}</span>
              </div>
              <Link href={`/tools/${t.slug}`} className="font-display text-base font-bold text-white group-hover:text-tool">
                {t.name}
              </Link>
              {t.vendor && <div className="text-[11px] text-slate-500">{t.vendor}</div>}
              <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{t.tagline}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ─── TRENDING WORKFLOWS ──────────────────────────────────────── */}
      <Section
        kicker="Workflows"
        title="Systems you can copy today"
        href="/workflows"
        accent="workflow"
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {workflows.map((w) => (
            <li key={w.id} className="card card-hover group p-5">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="rounded bg-workflow/15 px-1.5 py-0.5 font-semibold uppercase tracking-wider text-workflow">{w.kind}</span>
                <span className="text-growth">saves {w.timeSavedHours.toFixed(1)}h</span>
              </div>
              <Link href={`/workflows/${w.slug}`} className="font-display text-base font-bold text-white group-hover:text-workflow">
                {w.title}
              </Link>
              <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{w.objective}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* ─── STARTUP RADAR ───────────────────────────────────────────── */}
      <Section
        kicker="Startup Radar"
        title="Breakouts worth tracking"
        href="/startups"
        accent="startup"
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {startups.map((s) => (
            <li key={s.id} className="card card-hover group p-5">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                {s.isBreakout ? (
                  <span className="rounded bg-startup/20 px-1.5 py-0.5 font-bold uppercase tracking-wider text-startup">Breakout</span>
                ) : (
                  <span className="rounded border border-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{s.stage.replace("_", " ")}</span>
                )}
                <span className="font-display font-extrabold tabular-nums text-startup">{s.momentumScore.toFixed(0)}</span>
              </div>
              <Link href={`/startups/${s.slug}`} className="font-display text-base font-bold text-white group-hover:text-startup">
                {s.name}
              </Link>
              {s.hq && <div className="text-[11px] text-slate-500">{s.hq}</div>}
              <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{s.tagline}</p>
              {s.totalRaisedUsd ? (
                <div className="mt-3 text-[11px] text-slate-500">
                  Raised <span className="font-bold text-growth">${s.totalRaisedUsd.toFixed(0)}M</span>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </Section>

      {/* ─── LATEST NEWS (lowest priority) ───────────────────────────── */}
      {news.length > 0 && (
        <Section kicker="News" title="High-signal updates" href="/news" accent="slate">
          <ul className="grid gap-3 sm:grid-cols-2">
            {news.map((a) => (
              <li key={a.id} className="card card-hover p-4">
                {a.category?.name && (
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{a.category.name}</div>
                )}
                <Link href={`/article/${a.slug}`} className="font-display text-[14px] font-semibold leading-snug text-white hover:text-opportunity">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* ─── NEWSLETTER ─────────────────────────────────────────────── */}
      <section className="card overflow-hidden p-8 md:p-12">
        <div className="max-w-xl">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-opportunity">Daily Intelligence</div>
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">In your inbox.</h2>
          <p className="mt-2 text-slate-400">
            Top opportunities, signals, and tool launches — summarized and delivered. No spam.
          </p>
          <div className="mt-6"><NewsletterForm /></div>
        </div>
      </section>
    </div>
  );
}

function Section({
  kicker, title, href, accent, children,
}: {
  kicker: string; title: string; href: string;
  accent: "signal" | "opportunity" | "tool" | "workflow" | "startup" | "slate";
  children: React.ReactNode;
}) {
  const txt = {
    signal: "text-signal", opportunity: "text-opportunity", tool: "text-tool",
    workflow: "text-workflow", startup: "text-startup", slate: "text-slate-400",
  }[accent];
  return (
    <section className="mx-auto max-w-content">
      <div className="mb-7 flex items-end justify-between gap-6">
        <div>
          <div className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${txt}`}>{kicker}</div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-[1.7rem]">{title}</h2>
        </div>
        <Link href={href} className="shrink-0 text-[12px] font-semibold uppercase tracking-wider text-slate-500 hover:text-white">
          See all →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Mini({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  const good = invert ? v < 40 : v >= 70;
  const ok = invert ? v < 65 : v >= 50;
  const color = good ? "text-growth" : ok ? "text-warning" : "text-slate-500";
  return (
    <div className="rounded bg-canvas-elevated px-1.5 py-1">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-[12px] font-semibold tabular-nums ${color}`}>{v.toFixed(0)}</div>
    </div>
  );
}
