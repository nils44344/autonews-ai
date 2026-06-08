import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { scoreTier } from "@/lib/opportunity-score";

// Detail page for a single Opportunity. Designed to answer the doc's core
// question — "what opportunity does this create for the user, and how do they
// act on it?" — without reading like a blog post.
export const revalidate = 600;

interface MonetizationPath {
  path: string;
  model?: string;
  revenueRange?: string;
}
interface ToolRec {
  name: string;
  url?: string;
  why?: string;
}
interface WorkflowRec {
  title: string;
  url?: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const o = await prisma.opportunity.findUnique({
    where: { slug },
    select: { title: true, summary: true, seoTitle: true, seoDescription: true, ogImage: true, status: true },
  });
  if (!o || o.status !== "PUBLISHED") return { title: "Opportunity not found" };
  // Skip the seed-generated seoTitle (it appended "— Opportunity Score X"
  // which pushed many titles past 70 chars). Use the raw title; the template
  // in layout.tsx already adds "| AutoNews AI".
  const title = o.title.length <= 55 ? o.title : o.title.slice(0, 55) + "…";
  return {
    title,
    description: o.seoDescription ?? o.summary.slice(0, 160),
    alternates: { canonical: `${env.SITE_URL}/opportunities/${slug}` },
    openGraph: {
      type: "article",
      // Always include a branded fallback so the page never ships without an
      // og:image (audit flagged the row-level ogImage was null for seeds).
      images: o.ogImage ? [o.ogImage] : [`${env.SITE_URL}/opengraph-image`],
    },
  };
}

export default async function OpportunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const o = await prisma.opportunity.findUnique({ where: { slug } });
  if (!o || o.status !== "PUBLISHED") notFound();

  // Bump views asynchronously — never blocks render.
  prisma.opportunity.update({ where: { id: o.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const tier = scoreTier(o.opportunityScore);
  const monPaths = Array.isArray(o.monetizationPaths) ? (o.monetizationPaths as unknown as MonetizationPath[]) : [];
  const tools = Array.isArray(o.recommendedTools) ? (o.recommendedTools as unknown as ToolRec[]) : [];
  const workflows = Array.isArray(o.relatedWorkflows) ? (o.relatedWorkflows as unknown as WorkflowRec[]) : [];

  // Pull the news articles that surfaced this opportunity, so the user can
  // jump back to the source signal — closes the loop between news → action.
  const sourceArticles = o.relatedArticleIds.length
    ? await prisma.article.findMany({
        where: { id: { in: o.relatedArticleIds }, status: "PUBLISHED" },
        select: { slug: true, title: true, type: true },
        take: 6,
      })
    : [];

  return (
    <article className="space-y-10">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/opportunities"
            className="text-xs font-semibold uppercase tracking-wider text-emerald-600 hover:underline dark:text-emerald-400"
          >
            ← All Opportunities
          </Link>
          <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {o.kind.toLowerCase()}
          </span>
        </div>
        <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white md:text-5xl">
          {o.title}
        </h1>
        <p className="max-w-3xl text-lg text-slate-700 dark:text-slate-300">{o.summary}</p>
      </header>

      {/* Score panel */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[auto,1fr] md:gap-8">
        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 px-6 py-5 dark:bg-slate-800/60">
          <div className="font-display text-5xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {o.opportunityScore.toFixed(0)}
          </div>
          <div className={`mt-1 text-xs font-bold uppercase tracking-wider ${tier.color}`}>
            {tier.label}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
            Opportunity Score
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <ScoreBar label="Demand" v={o.demandScore} />
          <ScoreBar label="Growth" v={o.growthScore} />
          <ScoreBar label="Competition" v={o.competitionScore} invert />
          <ScoreBar label="Monetization" v={o.monetizationScore} />
          <ScoreBar label="Difficulty" v={o.difficultyScore} invert />
        </dl>
      </section>

      {/* Why it matters */}
      <Block title="Why it matters">{o.whyItMatters}</Block>

      {/* Market context */}
      {o.marketContext && <Block title="Market context">{o.marketContext}</Block>}

      {/* Implementation */}
      {o.implementation && <Block title="How to start">{o.implementation}</Block>}

      {/* Monetization paths */}
      {monPaths.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-slate-900 dark:text-white">
            Monetization paths
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {monPaths.map((m, i) => (
              <li
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="font-semibold text-slate-900 dark:text-white">{m.path}</div>
                {m.model && <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">{m.model}</div>}
                {m.revenueRange && (
                  <div className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {m.revenueRange}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommended tools */}
      {tools.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-slate-900 dark:text-white">
            Recommended tools
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((t, i) => (
              <li
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                {t.url ? (
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener nofollow"
                    className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    {t.name} ↗
                  </a>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">{t.name}</span>
                )}
                {t.why && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.why}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Related workflows */}
      {workflows.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-slate-900 dark:text-white">
            Related workflows
          </h2>
          <ul className="space-y-2">
            {workflows.map((w, i) => (
              <li key={i}>
                {w.url ? (
                  <Link href={w.url} className="text-emerald-700 hover:underline dark:text-emerald-400">
                    → {w.title}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-300">→ {w.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Source articles */}
      {sourceArticles.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="mb-3 font-display text-lg font-bold text-slate-900 dark:text-white">
            Signal sources
          </h2>
          <p className="mb-3 text-xs text-slate-500">News that surfaced this opportunity:</p>
          <ul className="space-y-1.5">
            {sourceArticles.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/${a.type === "BLOG" ? "blog" : "article"}/${a.slug}`}
                  className="text-sm text-slate-700 hover:text-emerald-700 hover:underline dark:text-slate-300 dark:hover:text-emerald-400"
                >
                  {a.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function ScoreBar({ label, v, invert = false }: { label: string; v: number; invert?: boolean }) {
  const good = invert ? v < 40 : v >= 70;
  const ok = invert ? v < 65 : v >= 50;
  const barColor = good
    ? "bg-emerald-500"
    : ok
      ? "bg-amber-500"
      : "bg-slate-400 dark:bg-slate-600";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
        <dd className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">{v.toFixed(0)}</dd>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className={`h-full ${barColor}`} style={{ width: `${Math.max(2, Math.min(100, v))}%` }} />
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <div className="prose prose-slate max-w-none whitespace-pre-line text-base leading-relaxed text-slate-700 dark:prose-invert dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}
