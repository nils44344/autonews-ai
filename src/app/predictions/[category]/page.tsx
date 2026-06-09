import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { CATEGORIES, findCategory } from "@/lib/categories";
import { formatUsd, formatSigned, dateShort } from "@/lib/format";
import { PriceChart } from "@/components/PriceChart";
import { Watchlist } from "@/components/Watchlist";
import { datasetSchema, newsArticleSchema, breadcrumbSchema, ldScript } from "@/lib/jsonld";

export const revalidate = 600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) return { title: "Category not found" };

  const title = `${cat.name} · 30-Day Price Forecast & AI Market Outlook`;
  const description = `Live AI predictions for the ${cat.name} segment. Track price trajectories, demand signals, and brand competition across the top automotive players.`;
  return {
    title,
    description,
    keywords: cat.keywords,
    alternates: { canonical: `${env.SITE_URL}/predictions/${category}` },
    openGraph: { type: "article", title, description, url: `${env.SITE_URL}/predictions/${category}`, siteName: env.SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPredictionPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) notFound();

  // Pull all predictions for this category, most recent per model
  const all = await prisma.pricePrediction.findMany({
    where: { category: { equals: cat.name.split(" ")[0], mode: "insensitive" } },
    orderBy: [{ asOf: "desc" }, { confidence: "desc" }],
    take: 100,
    include: { brand: true },
  }).catch(() => []);

  // Also catch by slug-style match (EV / ev / SUV / etc.)
  const altMatches = await prisma.pricePrediction.findMany({
    where: { category: { equals: cat.slug, mode: "insensitive" } },
    orderBy: [{ asOf: "desc" }],
    take: 100,
    include: { brand: true },
  }).catch(() => []);

  const merged = [...all, ...altMatches];
  const dedup = new Map<string, typeof merged[number]>();
  for (const m of merged) {
    const key = `${m.brandId}-${m.modelName}`;
    if (!dedup.has(key)) dedup.set(key, m);
  }
  const predictions = Array.from(dedup.values()).slice(0, 24);

  const url = `${env.SITE_URL}/predictions/${category}`;
  const ld = [
    datasetSchema({
      name: `${cat.name} Market Forecast Dataset`,
      description: cat.description,
      url,
      keywords: cat.keywords,
      variableMeasured: ["predicted price USD", "confidence interval", "trend direction"],
    }),
    newsArticleSchema({
      headline: `${cat.name} 30-Day Price Forecast & AI Market Outlook`,
      description: cat.description,
      url,
      datePublished: predictions[0]?.asOf ?? new Date(),
    }),
    breadcrumbSchema([
      { name: "Home", url: env.SITE_URL },
      { name: "Predictions", url: `${env.SITE_URL}/predictions/${category}` },
      { name: cat.name, url },
    ]),
  ];

  return (
    <>
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(obj) }} />
      ))}

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[12px] text-slate-500">
        <Link href="/" className="hover:text-white">Home</Link>
        <span>/</span>
        <span className="text-white">Predictions</span>
        <span>/</span>
        <span className="text-brand">{cat.name}</span>
      </nav>

      <header className="mb-10 border-b border-canvas-rule pb-8">
        <p className="bracket text-brand">[ CATEGORY · {cat.slug.toUpperCase()} ]</p>
        <h1 className="mt-3 text-white">{cat.name}</h1>
        <p className="mt-3 max-w-2xl text-[14px] text-slate-400">{cat.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {cat.keywords.slice(0, 6).map((k) => (
            <span key={k} className="rounded border border-canvas-rule bg-canvas-raised px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              {k}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          {predictions.length === 0 ? (
            <section className="card p-10 text-center">
              <h2 className="bracket text-brand">[ NO DATA · YET ]</h2>
              <p className="mt-3 text-[13px] text-slate-400">
                Predictions for {cat.name} populate after the first data ingest cycle. Subscribe to be notified.
              </p>
            </section>
          ) : (
            <section aria-labelledby="grid-h" className="card">
              <header className="flex items-center justify-between border-b border-canvas-rule px-6 py-4">
                <h2 id="grid-h" className="bracket text-brand">[ ALL · {predictions.length} MODELS ]</h2>
                <span className="bracket">UPDATED {dateShort(new Date())}</span>
              </header>
              <ul className="grid divide-y divide-canvas-rule">
                {predictions.map((p) => {
                  const delta = p.predictedPriceUsd - p.currentPriceUsd;
                  const pct = (delta / p.currentPriceUsd) * 100;
                  const up = delta >= 0;
                  return (
                    <li key={p.id}>
                      <Link href={`/trends/${p.brand.slug}`} className="grid gap-4 px-6 py-4 hover:bg-canvas-elevated lg:grid-cols-[1fr_280px_auto]">
                        <div>
                          <div className="text-[15px] font-bold">{p.brand.name} {p.modelName}</div>
                          <div className="bracket mt-1">[ {p.brand.country?.toUpperCase() ?? "—"} · CONF {p.confidence.toFixed(0)}% ]</div>
                        </div>
                        <div className="w-full">
                          <PriceChart current={p.currentPriceUsd} predicted={p.predictedPriceUsd} low={p.lowUsd} high={p.highUsd} height={120} />
                        </div>
                        <div className="text-right font-mono tnum">
                          <div className="text-[12px] text-slate-500">{formatUsd(p.currentPriceUsd)}</div>
                          <div className={`text-[16px] font-bold ${up ? "text-up" : "text-down"}`}>{formatUsd(p.predictedPriceUsd)}</div>
                          <div className={`text-[12px] ${up ? "text-up" : "text-down"}`}>{formatSigned(pct)}%</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <Watchlist />
          <section className="card p-4">
            <h3 className="bracket text-brand">[ OTHER · CATEGORIES ]</h3>
            <ul className="mt-3 space-y-1.5">
              {CATEGORIES.filter((c) => c.slug !== category).map((c) => (
                <li key={c.slug}>
                  <Link href={`/predictions/${c.slug}`} className="flex items-center justify-between rounded border border-canvas-rule px-3 py-2 hover:border-brand/40">
                    <span className="text-[13px] font-medium">{c.name}</span>
                    <span className="bracket">{c.slug.toUpperCase()}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
