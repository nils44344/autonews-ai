import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { NewsletterForm } from "@/components/NewsletterForm";
import { scoreTier } from "@/lib/opportunity-score";

// New homepage — Intelligence Dashboard. Per the product vision: this is NOT a
// news feed. Order: Hero → Trending Opportunities → Live Signals → Fastest
// Growing Tools → Trending Workflows → Startup Radar → Latest News → Newsletter.
// News drops to the bottom; the 5 intelligence pillars come first.
export const revalidate = 120;

// Local row types so safe<T>() falls back correctly when the DB is offline
// during build (otherwise Prisma's inferred type fights the [] fallback).
type NewsRow = {
  id: string; slug: string; title: string; dek: string | null;
  publishedAt: Date | null;
  category: { name: string } | null;
};

const OPP_KIND_LABEL: Record<string, string> = {
  BUSINESS: "Business", STARTUP: "Startup", AUTOMATION: "Automation",
  CREATOR: "Creator", AGENCY: "Agency", NICHE: "Niche", MONETIZATION: "Monetization",
};

const SIG_KIND_LABEL: Record<string, string> = {
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
  const [opportunities, signals, tools, workflows, startups, news] = await Promise.all([
    safe(prisma.opportunity.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { opportunityScore: "desc" },
      take: 4,
      select: { id: true, slug: true, title: true, summary: true, kind: true, opportunityScore: true },
    }), [] as Awaited<ReturnType<typeof prisma.opportunity.findMany>>),
    safe(prisma.signal.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isHot: "desc" }, { momentumScore: "desc" }],
      take: 6,
      select: { id: true, slug: true, title: true, kind: true, summary: true, momentumScore: true, isHot: true, observedAt: true, sourceLabel: true, toolSlug: true, opportunitySlug: true },
    }), [] as Awaited<ReturnType<typeof prisma.signal.findMany>>),
    safe(prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { momentumScore: "desc" },
      take: 6,
      select: { id: true, slug: true, name: true, tagline: true, vendor: true, momentumScore: true, ranking: true },
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
      select: { id: true, slug: true, name: true, tagline: true, momentumScore: true, isBreakout: true, stage: true, hq: true },
    }), [] as Awaited<ReturnType<typeof prisma.startup.findMany>>),
    safe<NewsRow[]>(prisma.article.findMany({
      where: { status: "PUBLISHED", type: "NEWS" },
      orderBy: { publishedAt: "desc" },
      take: 6,
      select: { id: true, slug: true, title: true, dek: true, publishedAt: true, category: { select: { name: true } } },
    }) as Promise<NewsRow[]>, []),
  ]);

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 text-white md:p-14">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> AI Intelligence Platform
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            Discover AI opportunities before everyone else.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-300 md:text-lg">
            Track AI trends, tools, workflows, startups, and market signals in one place. Stop reading what happened. Start building what's next.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/opportunities" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100">
              Explore Opportunities →
            </Link>
            <Link href="/signals" className="rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Live Signals
            </Link>
          </div>
        </div>
      </section>

      {/* TRENDING OPPORTUNITIES */}
      <section>
        <SectionHeader title="Trending Opportunities" href="/opportunities" accent="emerald" />
        <ul className="grid gap-5 md:grid-cols-2">
          {opportunities.map((o) => {
            const tier = scoreTier(o.opportunityScore);
            return (
              <li key={o.id}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {OPP_KIND_LABEL[o.kind] ?? o.kind}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold uppercase ${tier.color}`}>{tier.label}</span>
                    <span className="font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {o.opportunityScore.toFixed(0)}
                    </span>
                  </div>
                </div>
                <Link href={`/opportunities/${o.slug}`}
                  className="font-display text-lg font-bold leading-snug text-slate-900 group-hover:text-emerald-700 dark:text-white dark:group-hover:text-emerald-300">
                  {o.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{o.summary}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* LIVE SIGNALS */}
      <section>
        <SectionHeader title="Live AI Signals" href="/signals" accent="orange" subtitle="What's exploding right now" />
        <ul className="space-y-2">
          {signals.map((s) => (
            <li key={s.id}
              className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-orange-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-700">
              <div className="flex w-12 shrink-0 flex-col items-center">
                <div className="font-display text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {s.momentumScore.toFixed(0)}
                </div>
                <div className="text-[9px] uppercase text-slate-500">mtm</div>
              </div>
              <div className="flex-1">
                <div className="mb-0.5 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wider">
                  <span className="rounded-full bg-orange-50 px-1.5 py-0.5 font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                    {SIG_KIND_LABEL[s.kind] ?? s.kind}
                  </span>
                  {s.isHot && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 font-bold text-white">HOT</span>}
                  <span className="text-slate-500">{s.sourceLabel ?? "—"}</span>
                  <span className="text-slate-400">· {rel(s.observedAt)}</span>
                </div>
                <Link href="/signals" className="font-display text-base font-bold leading-snug text-slate-900 group-hover:text-orange-700 dark:text-white dark:group-hover:text-orange-300">
                  {s.title}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* FASTEST GROWING TOOLS */}
      <section>
        <SectionHeader title="Fastest Growing Tools" href="/tools" accent="sky" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <li key={t.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-sky-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-700">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                {t.ranking && <span>#{t.ranking}</span>}
                <span className="ml-auto font-display font-bold tabular-nums text-sky-600 dark:text-sky-400">
                  {t.momentumScore.toFixed(0)}
                </span>
              </div>
              <Link href={`/tools/${t.slug}`}
                className="font-display text-base font-extrabold text-slate-900 group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300">
                {t.name}
              </Link>
              {t.vendor && <div className="text-xs text-slate-500">{t.vendor}</div>}
              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{t.tagline}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* TRENDING WORKFLOWS */}
      <section>
        <SectionHeader title="Trending Workflows" href="/workflows" accent="violet" />
        <ul className="grid gap-4 sm:grid-cols-2">
          {workflows.map((w) => (
            <li key={w.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-700">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="rounded-full bg-violet-50 px-1.5 py-0.5 font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                  {w.kind}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">saves {w.timeSavedHours.toFixed(1)}h</span>
              </div>
              <Link href={`/workflows/${w.slug}`}
                className="font-display text-base font-bold text-slate-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                {w.title}
              </Link>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{w.objective}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* STARTUP RADAR */}
      <section>
        <SectionHeader title="Startup Radar" href="/startups" accent="rose" subtitle="Breakouts worth tracking" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {startups.map((s) => (
            <li key={s.id}
              className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-rose-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-700">
              <div className="mb-2 flex items-center justify-between text-xs">
                <div className="flex gap-1.5">
                  {s.isBreakout && <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">BREAKOUT</span>}
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {s.stage.replace("_", " ")}
                  </span>
                </div>
                <span className="font-display font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  {s.momentumScore.toFixed(0)}
                </span>
              </div>
              <Link href={`/startups/${s.slug}`}
                className="font-display text-base font-extrabold text-slate-900 group-hover:text-rose-700 dark:text-white dark:group-hover:text-rose-300">
                {s.name}
              </Link>
              {s.hq && <div className="text-xs text-slate-500">{s.hq}</div>}
              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{s.tagline}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* LATEST HIGH-SIGNAL NEWS */}
      {news.length > 0 && (
        <section>
          <SectionHeader title="Latest High-Signal News" href="/news" accent="slate" />
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {news.map((a) => (
              <li key={a.id}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900">
                {a.category?.name && (
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{a.category.name}</div>
                )}
                <Link href={`/article/${a.slug}`}
                  className="font-display text-sm font-bold leading-snug text-slate-900 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300">
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* NEWSLETTER */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white md:p-10">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-bold">Daily intelligence in your inbox</h2>
          <p className="mt-2 text-slate-300">
            The day's top opportunities, signals, and tool launches — summarized and delivered. No spam.
          </p>
          <div className="mt-5">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  accent,
  subtitle,
}: {
  title: string;
  href: string;
  accent: "emerald" | "orange" | "sky" | "violet" | "rose" | "slate";
  subtitle?: string;
}) {
  const bar = {
    emerald: "bg-emerald-500", orange: "bg-orange-500", sky: "bg-sky-500",
    violet: "bg-violet-500", rose: "bg-rose-500", slate: "bg-slate-400",
  }[accent];
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`h-6 w-1 rounded-full ${bar}`} />
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <Link href={href} className="text-xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        See all →
      </Link>
    </div>
  );
}
