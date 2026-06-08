import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SectionMark } from "@/components/SectionMark";
import { Ticker } from "@/components/Ticker";
import { scoreTier } from "@/lib/opportunity-score";

// Homepage — designed as an AI intelligence terminal, not a dashboard.
// Distinctive signature: bracketed numeric section marks, mono numerals,
// teal+amber accents, bento hero, ledger rows for tools/startups, live
// ticker under the hero. Built to feel unlike any other dark dashboard.

export const revalidate = 120;

type NewsRow = {
  id: string; slug: string; title: string; dek: string | null;
  publishedAt: Date | null;
  category: { name: string } | null;
};

const OPP_KIND: Record<string, string> = {
  BUSINESS: "BIZ", STARTUP: "STR", AUTOMATION: "AUT",
  CREATOR: "CRE", AGENCY: "AGY", NICHE: "NIC", MONETIZATION: "MON",
};
const SIG_KIND: Record<string, string> = {
  LAUNCH: "LAU", FUNDING: "FUN", GROWTH: "GRW",
  VIRAL_POST: "VIR", RESEARCH: "RES", HIRING: "HIR", ACQUISITION: "ACQ",
};

function rel(d: Date): string {
  const h = (Date.now() - d.getTime()) / 3600_000;
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(0)}h`;
  return `${(h / 24).toFixed(0)}d`;
}

export default async function HomePage() {
  const [topOpps, hotSignals, tools, workflows, startups, news] = await Promise.all([
    safe(prisma.opportunity.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { opportunityScore: "desc" },
      take: 4,
      select: { id: true, slug: true, title: true, summary: true, kind: true, opportunityScore: true, growthScore: true, demandScore: true, competitionScore: true },
    }), [] as Awaited<ReturnType<typeof prisma.opportunity.findMany>>),
    safe(prisma.signal.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isHot: "desc" }, { momentumScore: "desc" }],
      take: 8,
      select: { id: true, slug: true, title: true, kind: true, momentumScore: true, isHot: true, observedAt: true, sourceLabel: true, toolSlug: true, startupSlug: true, opportunitySlug: true },
    }), [] as Awaited<ReturnType<typeof prisma.signal.findMany>>),
    safe(prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { momentumScore: "desc" },
      take: 8,
      select: { id: true, slug: true, name: true, tagline: true, vendor: true, momentumScore: true, ranking: true, pricing: true },
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
      take: 6,
      select: { id: true, slug: true, name: true, tagline: true, momentumScore: true, isBreakout: true, stage: true, hq: true, totalRaisedUsd: true },
    }), [] as Awaited<ReturnType<typeof prisma.startup.findMany>>),
    safe<NewsRow[]>(prisma.article.findMany({
      where: { status: "PUBLISHED", type: "NEWS" },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: { id: true, slug: true, title: true, dek: true, publishedAt: true, category: { select: { name: true } } },
    }) as Promise<NewsRow[]>, []),
  ]);

  // Build ticker items from the hottest signals — shown as a Bloomberg-style
  // momentum strip under the hero. Pure SSR so it's crawlable + non-blocking.
  const tickerItems = hotSignals.slice(0, 6).map((s) => ({
    label: (s.toolSlug ?? s.startupSlug ?? "SIG").toUpperCase().replace(/-/g, " ").slice(0, 14),
    title: s.title.length > 70 ? s.title.slice(0, 70) + "…" : s.title,
    href: s.opportunitySlug ? `/opportunities/${s.opportunitySlug}` : s.toolSlug ? `/tools/${s.toolSlug}` : s.startupSlug ? `/startups/${s.startupSlug}` : "/signals",
    kind: (s.toolSlug ? "tool" : s.startupSlug ? "startup" : s.opportunitySlug ? "opportunity" : "signal") as "tool" | "startup" | "opportunity" | "signal",
    delta: `+${s.momentumScore.toFixed(0)}`,
  }));

  const [featuredOpp, ...sideOpps] = topOpps;

  return (
    <div className="space-y-24 md:space-y-28">
      {/* ─── HERO ─────────────────────────────────────────────────────
          Bento layout: featured opportunity (left, 2/3) + signals stack
          (right, 1/3). Distinctive vs the usual 3-col card row. */}
      <section className="relative -mx-5 -mt-10 overflow-hidden border-b border-canvas-rule px-5 pb-10 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:pb-14 md:pt-14">
        <div className="absolute inset-0 -z-10 grid-bg" />
        <div className="mx-auto max-w-content">
          {/* Headline block */}
          <div className="mb-3 inline-flex items-center gap-2 rounded border border-brand/30 bg-brand/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">
            <span className="h-1 w-1 animate-pulse rounded-full bg-brand" />
            <span>AI · INTELLIGENCE · TERMINAL</span>
          </div>
          <h1 className="font-display text-[2.1rem] font-extrabold leading-[1.03] tracking-tight text-white sm:text-[2.8rem] md:text-[3.4rem]">
            Discover AI opportunities <br className="hidden sm:block" />
            <span className="text-brand">before the market knows.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-slate-400">
            Track opportunities, signals, tools, workflows, and startups in one terminal. Read the market in seconds, not hours.
          </p>

          {/* Bento — featured opportunity + signal stack */}
          {featuredOpp && (
            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {/* Featured (2/3) */}
              <Link href={`/opportunities/${featuredOpp.slug}`}
                className="card card-hover edge-glow group relative col-span-2 flex flex-col justify-between overflow-hidden p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="bracket-label">[ TOP OPPORTUNITY · {OPP_KIND[featuredOpp.kind] ?? featuredOpp.kind} ]</div>
                    <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight text-white group-hover:text-brand md:text-3xl">
                      {featuredOpp.title}
                    </h2>
                    <p className="mt-3 max-w-xl text-[14px] text-slate-400">{featuredOpp.summary}</p>
                  </div>
                  <ScoreBlock score={featuredOpp.opportunityScore} tier={scoreTier(featuredOpp.opportunityScore)} />
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-canvas-rule pt-4">
                  <Stat label="Demand" v={featuredOpp.demandScore} />
                  <Stat label="Growth" v={featuredOpp.growthScore} />
                  <Stat label="Competition" v={featuredOpp.competitionScore} invert />
                </div>
              </Link>

              {/* Signals stack (1/3) */}
              <div className="card flex flex-col p-5">
                <div className="bracket-label mb-3">[ HOT · NOW ]</div>
                <ul className="flex-1 space-y-3">
                  {hotSignals.slice(0, 4).map((s) => (
                    <li key={s.id}>
                      <Link href="/signals" className="group flex items-start gap-3">
                        <span className="mt-1 inline-flex h-6 w-10 shrink-0 items-center justify-center rounded bg-signal/15 font-mono text-[10px] font-bold text-signal">
                          {SIG_KIND[s.kind] ?? "SIG"}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium leading-snug text-white group-hover:text-brand line-clamp-2">
                            {s.title}
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                            +{s.momentumScore.toFixed(0)} · {rel(s.observedAt)}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/signals" className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-brand hover:underline">
                  All signals →
                </Link>
              </div>

              {/* Side opportunities (full width below) */}
              {sideOpps.length > 0 && (
                <div className="col-span-3 grid gap-3 md:grid-cols-3">
                  {sideOpps.map((o) => {
                    const tier = scoreTier(o.opportunityScore);
                    return (
                      <Link key={o.id} href={`/opportunities/${o.slug}`}
                        className="card card-hover group flex flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <span className="rounded bg-opportunity/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-opportunity">
                            {OPP_KIND[o.kind] ?? o.kind}
                          </span>
                          <div className="text-right">
                            <div className="font-mono text-2xl font-extrabold tabular-nums leading-none text-white tnum">
                              {o.opportunityScore.toFixed(0)}
                            </div>
                            <div className={`mt-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${tier.color}`}>
                              {tier.label}
                            </div>
                          </div>
                        </div>
                        <h3 className="mt-4 font-display text-[15px] font-bold leading-snug text-white group-hover:text-brand">
                          {o.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{o.summary}</p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── LIVE TICKER ───────────────────────────────────────────── */}
      {tickerItems.length > 0 && (
        <div className="-mx-5 sm:-mx-6">
          <Ticker items={tickerItems} />
        </div>
      )}

      {/* ─── [02] FASTEST GROWING TOOLS (ledger style) ─────────────── */}
      <section className="mx-auto max-w-content">
        <SectionMark
          index={2}
          label="Tools"
          kicker="fastest growing right now"
          accent="tool"
          trailing={<Link href="/tools" className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-brand">View all →</Link>}
        />
        <div className="card divide-y divide-canvas-rule overflow-hidden">
          {tools.map((t) => (
            <Link key={t.id} href={`/tools/${t.slug}`}
              className="ledger-row grid-cols-[44px_1fr_auto_80px_50px]">
              <span className="font-mono text-[12px] font-bold text-slate-500 tnum">
                {t.ranking ? `#${String(t.ranking).padStart(2, "0")}` : "—"}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[14px] font-bold text-white">{t.name}</span>
                  {t.vendor && <span className="text-[11px] text-slate-500">· {t.vendor}</span>}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[12px] text-slate-400">{t.tagline}</div>
              </div>
              <span className="rounded bg-canvas-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {t.pricing}
              </span>
              <span className="text-right font-mono text-[14px] font-bold tabular-nums text-tool tnum">
                {t.momentumScore.toFixed(0)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600 group-hover:text-brand">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── [03] WORKFLOWS ────────────────────────────────────────── */}
      <section className="mx-auto max-w-content">
        <SectionMark
          index={3}
          label="Workflows"
          kicker="systems to copy today"
          accent="workflow"
          trailing={<Link href="/workflows" className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-brand">View all →</Link>}
        />
        <ul className="grid gap-4 sm:grid-cols-2">
          {workflows.map((w) => (
            <li key={w.id} className="card card-hover group p-5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-workflow/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-workflow">
                  {w.kind}
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-growth tnum">
                  Saves {w.timeSavedHours.toFixed(1)}h
                </span>
              </div>
              <Link href={`/workflows/${w.slug}`} className="mt-3 block font-display text-[16px] font-bold leading-snug text-white group-hover:text-brand">
                {w.title}
              </Link>
              <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{w.objective}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── [04] STARTUP RADAR (ledger style) ─────────────────────── */}
      <section className="mx-auto max-w-content">
        <SectionMark
          index={4}
          label="Startups"
          kicker="breakouts on the radar"
          accent="startup"
          trailing={<Link href="/startups" className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-brand">View all →</Link>}
        />
        <div className="card divide-y divide-canvas-rule overflow-hidden">
          {startups.map((s) => (
            <Link key={s.id} href={`/startups/${s.slug}`}
              className="ledger-row grid-cols-[1fr_70px_auto_60px_50px]">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[14px] font-bold text-white">{s.name}</span>
                  {s.isBreakout && (
                    <span className="rounded bg-startup/20 px-1 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-startup">
                      BREAKOUT
                    </span>
                  )}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[12px] text-slate-400">{s.tagline}</div>
              </div>
              <span className="text-right font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {s.stage.replace("_", " ")}
              </span>
              <span className="text-right font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {s.hq ?? "—"}
              </span>
              <span className="text-right font-mono text-[14px] font-bold tabular-nums text-startup tnum">
                {s.momentumScore.toFixed(0)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── [05] LATEST NEWS (lowest priority) ────────────────────── */}
      {news.length > 0 && (
        <section className="mx-auto max-w-content">
          <SectionMark
            index={5}
            label="News"
            kicker="high-signal only"
            accent="slate"
            trailing={<Link href="/news" className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-brand">View all →</Link>}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {news.map((a) => (
              <li key={a.id} className="card card-hover p-4">
                {a.category?.name && (
                  <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {a.category.name}
                  </div>
                )}
                <Link href={`/article/${a.slug}`} className="font-display text-[13px] font-semibold leading-snug text-white hover:text-brand">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─── NEWSLETTER ─────────────────────────────────────────────── */}
      <section className="card edge-glow relative mx-auto max-w-content overflow-hidden p-8 md:p-12">
        <div className="max-w-xl">
          <div className="bracket-label mb-2 text-brand">[ DAILY · INTELLIGENCE ]</div>
          <h2 className="font-display text-2xl font-bold text-white md:text-3xl">In your inbox.</h2>
          <p className="mt-2 text-[14px] text-slate-400">
            Top opportunities, signals, and tool launches — summarized and delivered. No spam.
          </p>
          <div className="mt-6"><NewsletterForm /></div>
        </div>
      </section>
    </div>
  );
}

function ScoreBlock({ score, tier }: { score: number; tier: { label: string; color: string } }) {
  return (
    <div className="rounded-lg border border-canvas-rule bg-canvas px-4 py-3 text-right">
      <div className="font-mono text-[10px] uppercase tracking-bracket text-slate-500">OPP SCORE</div>
      <div className="mt-1 font-mono text-4xl font-extrabold tabular-nums leading-none text-brand tnum">
        {score.toFixed(0)}
      </div>
      <div className={`mt-1 font-mono text-[10px] font-bold uppercase tracking-wider ${tier.color}`}>
        {tier.label}
      </div>
    </div>
  );
}

function Stat({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  const good = invert ? v < 40 : v >= 70;
  const ok = invert ? v < 65 : v >= 50;
  const color = good ? "text-growth" : ok ? "text-accent" : "text-slate-500";
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-bracket text-slate-500">{label}</div>
      <div className={`mt-1 font-mono text-xl font-bold tabular-nums tnum ${color}`}>
        {v.toFixed(0)}
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-canvas-elevated">
        <div className={`h-full ${good ? "bg-growth" : ok ? "bg-accent" : "bg-slate-500"}`}
          style={{ width: `${Math.max(2, Math.min(100, invert ? 100 - v : v))}%` }} />
      </div>
    </div>
  );
}
