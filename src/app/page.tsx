import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SectionMark } from "@/components/SectionMark";
import { Ticker } from "@/components/Ticker";
import { OpportunityRadar } from "@/components/OpportunityRadar";
import { Sparkline } from "@/components/Sparkline";
import { AsciiRule } from "@/components/AsciiRule";
import { scoreTier } from "@/lib/opportunity-score";

// Homepage — designed as an AI intelligence terminal, not a dashboard.
// New distinctive elements per the owner's "build it new and unique" brief:
//   - Pure-black canvas + film grain (in globals.css)
//   - Editorial serif headline (Instrument Serif) mixed with Geist Mono data
//   - SVG Opportunity Radar replacing the bento grid — real data viz
//   - Sparklines on every ledger row showing momentum trajectory
//   - ASCII (═══) rules between sections
//   - Asymmetric editorial layout instead of equal 3-col grids

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
  const [opps, hotSignals, tools, workflows, startups, news] = await Promise.all([
    safe(prisma.opportunity.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { opportunityScore: "desc" },
      take: 14,
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

  const tickerItems = hotSignals.slice(0, 6).map((s) => ({
    label: (s.toolSlug ?? s.startupSlug ?? "SIG").toUpperCase().replace(/-/g, " ").slice(0, 14),
    title: s.title.length > 70 ? s.title.slice(0, 70) + "…" : s.title,
    href: s.opportunitySlug ? `/opportunities/${s.opportunitySlug}` : s.toolSlug ? `/tools/${s.toolSlug}` : s.startupSlug ? `/startups/${s.startupSlug}` : "/signals",
    kind: (s.toolSlug ? "tool" : s.startupSlug ? "startup" : s.opportunitySlug ? "opportunity" : "signal") as "tool" | "startup" | "opportunity" | "signal",
    delta: `+${s.momentumScore.toFixed(0)}`,
  }));

  const featured = opps[0];
  const top3 = opps.slice(0, 3);

  return (
    <div className="space-y-20 md:space-y-24">
      {/* ─── HERO: editorial headline + SVG radar ─────────────────── */}
      <section className="relative -mx-5 -mt-10 overflow-hidden border-b border-canvas-rule px-5 pb-10 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:pb-16 md:pt-16">
        <div className="absolute inset-0 -z-10 grid-bg" />
        <div className="mx-auto grid max-w-content gap-10 md:grid-cols-[1.1fr_1fr] md:gap-12">
          {/* Left: editorial headline */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-max items-center gap-2 rounded border border-brand/30 bg-brand/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">
              <span className="h-1 w-1 animate-pulse rounded-full bg-brand" />
              AI · INTELLIGENCE · TERMINAL
            </div>
            <h1 className="font-display text-[2.6rem] font-normal leading-[0.98] tracking-tight text-[color:rgb(var(--fg))] sm:text-[3.4rem] md:text-[4.2rem]">
              Read the market <br />
              <span className="italic text-brand">before the market</span> <br />
              knows.
            </h1>
            <p className="mt-6 max-w-md text-[14px] leading-relaxed text-[color:rgb(var(--muted-fg))]">
              An intelligence terminal for AI opportunities, signals, tools, workflows, and startups. Built for builders who want edge, not summary.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/opportunities" className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 font-mono text-[12px] font-bold uppercase tracking-bracket text-black hover:bg-brand-light">
                [→] EXPLORE OPPORTUNITIES
              </Link>
              <Link href="/signals" className="inline-flex h-10 items-center gap-2 rounded-md border border-canvas-rule bg-canvas-raised px-4 font-mono text-[12px] font-bold uppercase tracking-bracket text-[color:rgb(var(--fg))] hover:border-brand/40 hover:text-brand">
                LIVE SIGNALS
              </Link>
            </div>
          </div>

          {/* Right: SVG opportunity radar */}
          <div className="card edge-glow relative overflow-hidden p-3 md:p-4">
            <div className="mb-1 flex items-center justify-between px-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">[ RADAR ]</span>
              <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">DEMAND × GROWTH × SCORE</span>
            </div>
            <OpportunityRadar items={opps.slice(0, 10)} />
            <div className="mt-1 px-2 font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">
              {opps.length} active · ranked by opportunity score
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE TICKER ────────────────────────────────────────── */}
      {tickerItems.length > 0 && (
        <div className="-mx-5 sm:-mx-6">
          <Ticker items={tickerItems} />
        </div>
      )}

      {/* ─── [01] FEATURED OPPORTUNITY ─ asymmetric editorial spread */}
      {featured && (
        <section className="mx-auto max-w-content">
          <SectionMark
            index={1}
            label="Opportunities"
            kicker="featured · highest score"
            accent="brand"
            trailing={<Link href="/opportunities" className="font-mono text-[11px] font-bold uppercase tracking-wider text-[color:rgb(var(--muted-fg))] hover:text-brand">All →</Link>}
          />
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <Link href={`/opportunities/${featured.slug}`}
              className="group block border-l-2 border-brand pl-6 md:pl-10">
              <div className="font-mono text-[10px] uppercase tracking-bracket text-brand">
                [ {OPP_KIND[featured.kind] ?? featured.kind} · SCORE {featured.opportunityScore.toFixed(0)} ]
              </div>
              <h2 className="mt-3 font-display text-[2rem] font-normal italic leading-[1.05] text-[color:rgb(var(--fg))] group-hover:text-brand md:text-[2.6rem]">
                {featured.title}
              </h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[color:rgb(var(--muted-fg))]">
                {featured.summary}
              </p>
              <div className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-bracket text-brand">
                READ THE OPPORTUNITY <span className="text-accent">→</span>
              </div>
            </Link>
            <div className="card grid grid-cols-1 gap-3 p-5">
              <ScoreRow label="Demand" v={featured.demandScore} />
              <ScoreRow label="Growth" v={featured.growthScore} />
              <ScoreRow label="Competition" v={featured.competitionScore} invert />
              <div className="mt-2 border-t border-canvas-rule pt-3">
                <div className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">OPPORTUNITY · SCORE</div>
                <div className="mt-1 flex items-end gap-3">
                  <span className="font-display text-[3.5rem] italic leading-none text-brand tnum">
                    {featured.opportunityScore.toFixed(0)}
                  </span>
                  <span className={`mb-1 font-mono text-[10px] font-bold uppercase tracking-bracket ${scoreTier(featured.opportunityScore).color}`}>
                    {scoreTier(featured.opportunityScore).label}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Other top 2 — minimal byline-only entries */}
          {top3.length > 1 && (
            <div className="mt-10 grid gap-x-10 gap-y-3 border-t border-canvas-rule pt-6 md:grid-cols-2">
              {top3.slice(1).map((o) => (
                <Link key={o.id} href={`/opportunities/${o.slug}`}
                  className="group flex items-start justify-between gap-4 py-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">
                      [ {OPP_KIND[o.kind] ?? o.kind} ]
                    </div>
                    <div className="mt-1 font-display text-[18px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand">
                      {o.title}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl italic text-brand tnum">{o.opportunityScore.toFixed(0)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* ─── [02] TOOLS ledger with sparklines ─────────────────── */}
      <section className="mx-auto max-w-content">
        <SectionMark
          index={2}
          label="Tools"
          kicker="fastest growing"
          accent="tool"
          trailing={<Link href="/tools" className="font-mono text-[11px] font-bold uppercase tracking-wider text-[color:rgb(var(--muted-fg))] hover:text-brand">All →</Link>}
        />
        <div className="card divide-y divide-canvas-rule overflow-hidden">
          {tools.map((t) => (
            <Link key={t.id} href={`/tools/${t.slug}`}
              className="ledger-row group grid-cols-[44px_1fr_auto_100px_50px_30px]">
              <span className="font-mono text-[12px] font-bold text-[color:rgb(var(--muted-fg))] tnum">
                {t.ranking ? `#${String(t.ranking).padStart(2, "0")}` : "—"}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[18px] italic text-[color:rgb(var(--fg))] group-hover:text-brand">{t.name}</span>
                  {t.vendor && <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">{t.vendor}</span>}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[12px] text-[color:rgb(var(--muted-fg))]">{t.tagline}</div>
              </div>
              <span className="rounded bg-canvas-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">
                {t.pricing}
              </span>
              <span className="text-tool">
                <Sparkline score={t.momentumScore} seed={t.slug} color="rgb(56 189 248)" />
              </span>
              <span className="text-right font-mono text-[14px] font-bold tabular-nums text-tool tnum">
                {t.momentumScore.toFixed(0)}
              </span>
              <span className="font-mono text-[10px] text-[color:rgb(var(--muted-fg))] group-hover:text-brand">→</span>
            </Link>
          ))}
        </div>
      </section>

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* ─── [03] WORKFLOWS ─ asymmetric pull-quote layout ─────── */}
      <section className="mx-auto max-w-content">
        <SectionMark
          index={3}
          label="Workflows"
          kicker="systems to copy"
          accent="workflow"
          trailing={<Link href="/workflows" className="font-mono text-[11px] font-bold uppercase tracking-wider text-[color:rgb(var(--muted-fg))] hover:text-brand">All →</Link>}
        />
        <div className="grid gap-8 md:grid-cols-2">
          {workflows.map((w, i) => (
            <Link key={w.id} href={`/workflows/${w.slug}`}
              className={`group block border-t border-canvas-rule pt-5 ${i % 2 ? "md:mt-12" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-bracket text-workflow">
                  [ {w.kind} ]
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-growth tnum">
                  +{w.timeSavedHours.toFixed(1)}h
                </span>
              </div>
              <h3 className="mt-3 font-display text-[22px] italic leading-tight text-[color:rgb(var(--fg))] group-hover:text-brand">
                {w.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-[13px] text-[color:rgb(var(--muted-fg))]">{w.objective}</p>
            </Link>
          ))}
        </div>
      </section>

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* ─── [04] STARTUPS ledger with sparklines ──────────────── */}
      <section className="mx-auto max-w-content">
        <SectionMark
          index={4}
          label="Startups"
          kicker="radar"
          accent="startup"
          trailing={<Link href="/startups" className="font-mono text-[11px] font-bold uppercase tracking-wider text-[color:rgb(var(--muted-fg))] hover:text-brand">All →</Link>}
        />
        <div className="card divide-y divide-canvas-rule overflow-hidden">
          {startups.map((s) => (
            <Link key={s.id} href={`/startups/${s.slug}`}
              className="ledger-row group grid-cols-[1fr_70px_auto_100px_60px_30px]">
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[18px] italic text-[color:rgb(var(--fg))] group-hover:text-brand">{s.name}</span>
                  {s.isBreakout && (
                    <span className="rounded bg-startup/20 px-1 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-startup">
                      BREAKOUT
                    </span>
                  )}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[12px] text-[color:rgb(var(--muted-fg))]">{s.tagline}</div>
              </div>
              <span className="text-right font-mono text-[10px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">
                {s.stage.replace("_", " ")}
              </span>
              <span className="text-right font-mono text-[10px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">
                {s.hq ?? "—"}
              </span>
              <span className="text-startup">
                <Sparkline score={s.momentumScore} seed={s.slug} color="rgb(251 113 133)" />
              </span>
              <span className="text-right font-mono text-[14px] font-bold tabular-nums text-startup tnum">
                {s.momentumScore.toFixed(0)}
              </span>
              <span className="font-mono text-[10px] text-[color:rgb(var(--muted-fg))] group-hover:text-brand">→</span>
            </Link>
          ))}
        </div>
      </section>

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* ─── [05] NEWS ─ low priority, byline format ─────────── */}
      {news.length > 0 && (
        <section className="mx-auto max-w-content">
          <SectionMark
            index={5}
            label="News"
            kicker="high-signal only"
            accent="slate"
            trailing={<Link href="/news" className="font-mono text-[11px] font-bold uppercase tracking-wider text-[color:rgb(var(--muted-fg))] hover:text-brand">All →</Link>}
          />
          <ul className="divide-y divide-canvas-rule">
            {news.map((a) => (
              <li key={a.id} className="py-3">
                <Link href={`/article/${a.slug}`} className="group flex items-baseline gap-4">
                  {a.category?.name && (
                    <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">
                      {a.category.name}
                    </span>
                  )}
                  <span className="font-display text-[16px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand">
                    {a.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* ─── NEWSLETTER ─ editorial CTA ─────────────────────── */}
      <section className="card edge-glow relative mx-auto max-w-content overflow-hidden p-8 md:p-14">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">
              [ DAILY · INTELLIGENCE ]
            </div>
            <h2 className="mt-3 font-display text-[2.2rem] font-normal italic leading-none text-[color:rgb(var(--fg))] md:text-[2.8rem]">
              Get the edge in your inbox.
            </h2>
            <p className="mt-4 max-w-md text-[14px] text-[color:rgb(var(--muted-fg))]">
              Top opportunities, signals, and tool launches — synthesised by AI, polished by humans, delivered before the market notices.
            </p>
          </div>
          <div className="flex items-center"><NewsletterForm /></div>
        </div>
      </section>
    </div>
  );
}

function ScoreRow({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  const good = invert ? v < 40 : v >= 70;
  const ok = invert ? v < 65 : v >= 50;
  const c = good ? "text-growth" : ok ? "text-accent" : "text-[color:rgb(var(--muted-fg))]";
  const fill = good ? "bg-growth" : ok ? "bg-accent" : "bg-[color:rgb(var(--canvas-elevated))]";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">{label}</span>
        <span className={`font-mono text-[16px] font-bold tabular-nums tnum ${c}`}>{v.toFixed(0)}</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-canvas-elevated">
        <div className={`h-full ${fill}`} style={{ width: `${Math.max(2, Math.min(100, invert ? 100 - v : v))}%` }} />
      </div>
    </div>
  );
}
