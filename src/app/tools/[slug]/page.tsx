import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// Tool detail page. Editorial layout — never a feature-comparison table dump.
export const revalidate = 600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = await prisma.tool.findUnique({
    where: { slug },
    select: { name: true, tagline: true, seoTitle: true, seoDescription: true, status: true, ogImage: true },
  });
  if (!t || t.status !== "PUBLISHED") return { title: "Tool not found" };
  return {
    title: t.seoTitle ?? `${t.name} — ${t.tagline}`,
    description: t.seoDescription ?? t.tagline,
    alternates: { canonical: `${env.SITE_URL}/tools/${slug}` },
    openGraph: { type: "article", images: t.ogImage ? [t.ogImage] : undefined },
  };
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await prisma.tool.findUnique({ where: { slug } });
  if (!t || t.status !== "PUBLISHED") notFound();

  prisma.tool.update({ where: { id: t.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const useCases = Array.isArray(t.useCases) ? (t.useCases as string[]) : [];
  const pros = Array.isArray(t.pros) ? (t.pros as string[]) : [];
  const cons = Array.isArray(t.cons) ? (t.cons as string[]) : [];

  const alternativeTools = t.alternatives.length
    ? await prisma.tool.findMany({
        where: { slug: { in: t.alternatives }, status: "PUBLISHED" },
        select: { slug: true, name: true, tagline: true },
        take: 4,
      })
    : [];

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <Link href="/tools" className="text-xs font-semibold uppercase tracking-wider text-sky-600 hover:underline dark:text-sky-400">
          ← All Tools
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
          {t.name}
        </h1>
        {t.vendor && <div className="text-sm text-slate-500">by {t.vendor}</div>}
        <p className="max-w-3xl text-lg text-slate-700 dark:text-slate-300">{t.tagline}</p>
        {t.url && (
          <a href={t.url} target="_blank" rel="noopener nofollow"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            Visit site ↗
          </a>
        )}
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Momentum" v={t.momentumScore} />
        <Metric label="Trending" v={t.trendingScore} />
        <Metric label="Popularity" v={t.popularityScore} />
      </section>

      <Block title="Overview">{t.overview}</Block>
      <Block title="Why it matters">{t.whyItMatters}</Block>

      {useCases.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-slate-900 dark:text-white">Use cases</h2>
          <ul className="space-y-2">
            {useCases.map((u, i) => <li key={i} className="text-slate-700 dark:text-slate-300">→ {u}</li>)}
          </ul>
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        {pros.length > 0 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Pros</h3>
            <ul className="space-y-1 text-sm">
              {pros.map((p, i) => <li key={i} className="text-slate-700 dark:text-slate-200">+ {p}</li>)}
            </ul>
          </div>
        )}
        {cons.length > 0 && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
            <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Cons</h3>
            <ul className="space-y-1 text-sm">
              {cons.map((c, i) => <li key={i} className="text-slate-700 dark:text-slate-200">− {c}</li>)}
            </ul>
          </div>
        )}
      </section>

      {(t.pricing || t.pricingNotes) && (
        <section className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
          <h3 className="mb-2 font-display text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Pricing</h3>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-semibold">{t.pricing}</span>
            {t.pricingNotes && <> · {t.pricingNotes}</>}
          </div>
        </section>
      )}

      {alternativeTools.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-slate-900 dark:text-white">Alternatives</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {alternativeTools.map((a) => (
              <li key={a.slug}>
                <Link href={`/tools/${a.slug}`} className="block rounded-xl border border-slate-200 p-4 hover:border-sky-300 dark:border-slate-800 dark:hover:border-sky-700">
                  <div className="font-semibold text-slate-900 dark:text-white">{a.name}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{a.tagline}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Metric({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 font-display text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{v.toFixed(0)}</div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full bg-sky-500" style={{ width: `${v}%` }} />
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
