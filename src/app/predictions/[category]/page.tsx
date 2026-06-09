import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { CATEGORIES, findCategory } from "@/lib/categories";
import { formatUsd, formatSigned, dateShort } from "@/lib/format";
import { datasetSchema, newsArticleSchema, breadcrumbSchema, ldScript } from "@/lib/jsonld";

export const revalidate = 600;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) return { title: "Category not found" };
  const title = `${cat.name} · 30-Day Price Forecast & Market Outlook`;
  const description = cat.description;
  return {
    title, description,
    keywords: cat.keywords,
    alternates: { canonical: `${env.SITE_URL}/predictions/${category}` },
    openGraph: { type: "article", title, description, url: `${env.SITE_URL}/predictions/${category}`, siteName: env.SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = findCategory(category);
  if (!cat) notFound();

  // Pull predictions where category matches (case-insensitive, includes slug variants)
  const slug = cat.slug.toUpperCase();
  const variants = [cat.name, cat.slug, slug, cat.name.split(" ")[0]];
  const all = await prisma.pricePrediction.findMany({
    where: { category: { in: variants } },
    orderBy: [{ asOf: "desc" }],
    take: 200,
    include: { brand: true },
  }).catch(() => []);

  // De-dupe to latest per brand-model
  const seen = new Map<string, typeof all[number]>();
  for (const p of all) {
    const key = `${p.brandId}-${p.modelName}`;
    if (!seen.has(key)) seen.set(key, p);
  }
  const predictions = Array.from(seen.values());

  const movers = [...predictions]
    .map((p) => ({ ...p, deltaPct: ((p.predictedPriceUsd - p.currentPriceUsd) / p.currentPriceUsd) * 100 }))
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));

  const up = movers.filter((m) => m.deltaPct > 0);
  const down = movers.filter((m) => m.deltaPct < 0);
  const avgConfidence = predictions.length ? predictions.reduce((a, p) => a + p.confidence, 0) / predictions.length : 0;
  const avgDelta = movers.length ? movers.reduce((a, m) => a + m.deltaPct, 0) / movers.length : 0;

  const url = `${env.SITE_URL}/predictions/${category}`;
  const ld = [
    datasetSchema({
      name: `${cat.name} · Market Forecast Dataset`,
      description: cat.description,
      url, keywords: cat.keywords,
    }),
    newsArticleSchema({
      headline: `${cat.name} · 30-Day Price Forecast & Market Outlook`,
      description: cat.description,
      url, datePublished: predictions[0]?.asOf ?? new Date(),
    }),
    breadcrumbSchema([
      { name: "Home", url: env.SITE_URL },
      { name: "Categories", url: `${env.SITE_URL}/predictions/${category}` },
      { name: cat.name, url },
    ]),
  ];

  return (
    <>
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(obj) }} />
      ))}

      <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-2 text-[12px] text-slate-500">
        <Link href="/" className="hover:text-white">Home</Link><span>/</span>
        <span className="text-slate-400">Categories</span><span>/</span>
        <span className="text-brand">{cat.name}</span>
      </nav>

      {/* HERO ─────────────────────────────────────── */}
      <header className="relative isolate mb-20 pb-10">
        <div className="absolute inset-0 -z-10 aurora" aria-hidden />
        <div className="label label-brand">Category · {cat.slug.toUpperCase()}</div>
        <h1 className="mt-4 text-white">{cat.name}</h1>
        <p className="mt-5 max-w-2xl text-[15px] text-slate-400">{cat.description}</p>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-canvas-rule bg-canvas-rule sm:grid-cols-4">
          <StatBlock label="Models tracked" value={predictions.length.toString()} sub={`${new Set(predictions.map((p) => p.brandId)).size} brands`} />
          <StatBlock label="Going up" value={up.length.toString()} sub={`${((up.length / Math.max(1, predictions.length)) * 100).toFixed(0)}% of category`} tone="up" />
          <StatBlock label="Going down" value={down.length.toString()} sub={`${((down.length / Math.max(1, predictions.length)) * 100).toFixed(0)}% of category`} tone="down" />
          <StatBlock label="Avg confidence" value={`${avgConfidence.toFixed(0)}%`} sub={`Avg Δ ${avgDelta >= 0 ? "+" : ""}${avgDelta.toFixed(1)}%`} />
        </div>
      </header>

      {/* TOP MOVERS ──────────────────────────────── */}
      {movers.length > 0 ? (
        <>
          <section className="mb-24">
            <SectionHead label="01 / Top Movers" title="Biggest 30-day forecast swings." />
            <ul className="mt-10 grid gap-1">
              {movers.slice(0, 12).map((m) => {
                const rising = m.deltaPct >= 0;
                return (
                  <li key={m.id}>
                    <Link href={`/trends/${m.brand.slug}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-8 border-b border-canvas-rule py-5 transition hover:border-brand/30">
                      <div>
                        <div className="text-[15px] font-semibold">{m.brand.name} <span className="text-slate-500">·</span> {m.modelName}</div>
                        <div className="label mt-1">{m.brand.country} · confidence {m.confidence.toFixed(0)}%</div>
                      </div>
                      <div className="hidden font-mono text-[13px] text-slate-500 sm:block tnum">
                        {formatUsd(m.currentPriceUsd)} → <span className="text-white">{formatUsd(m.predictedPriceUsd)}</span>
                      </div>
                      <div className={`text-right font-mono text-[18px] font-bold tnum ${rising ? "text-up" : "text-down"}`}>
                        {formatSigned(m.deltaPct)}%
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* BY BRAND ──────────────────────────────── */}
          <section className="mb-24">
            <SectionHead label="02 / By Brand" title="Forecasts grouped by manufacturer." />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(groupByBrand(predictions)).slice(0, 12).map(([brandId, ps]) => {
                const brand = ps[0].brand;
                const avg = ps.reduce((a, p) => a + ((p.predictedPriceUsd - p.currentPriceUsd) / p.currentPriceUsd) * 100, 0) / ps.length;
                return (
                  <Link key={brandId} href={`/trends/${brand.slug}`} className="surface group p-6 transition hover:border-brand/30">
                    <div className="flex items-center justify-between">
                      <div className="text-[16px] font-semibold">{brand.name}</div>
                      <div className={`font-mono text-[16px] font-bold tnum ${avg >= 0 ? "text-up" : "text-down"}`}>
                        {avg >= 0 ? "+" : ""}{avg.toFixed(1)}%
                      </div>
                    </div>
                    <div className="label mt-2">{ps.length} model{ps.length === 1 ? "" : "s"} · {brand.country}</div>
                    <div className="mt-3 line-clamp-1 text-[12px] text-slate-500">
                      {ps.slice(0, 3).map((p) => p.modelName).join(" · ")}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="surface p-12 text-center">
          <div className="label label-brand">No data yet</div>
          <h2 className="mt-3">{cat.name} predictions populate after the next ingest cycle.</h2>
          <p className="mt-3 text-slate-500">Refreshed every 4 hours.</p>
        </section>
      )}

      {/* OTHER CATEGORIES ────────────────────────── */}
      <section>
        <SectionHead label="03 / Other Categories" title="Explore other segments." />
        <ul className="mt-10 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.filter((c) => c.slug !== category).map((c) => (
            <li key={c.slug}>
              <Link href={`/predictions/${c.slug}`} className="flex items-center justify-between border-b border-canvas-rule py-3 transition hover:border-brand/30 hover:text-brand">
                <span className="text-[14px] font-medium">{c.name}</span>
                <span className="label">{c.slug.toUpperCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 text-right text-[11px] text-slate-600">
        Updated · {dateShort(new Date())}
      </div>
    </>
  );
}

function groupByBrand<T extends { brandId: string; brand: { name: string; slug: string; country: string | null } }>(items: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const p of items) {
    if (!out[p.brandId]) out[p.brandId] = [];
    out[p.brandId].push(p);
  }
  return out;
}

function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-canvas-rule pb-4">
      <div className="label label-brand">{label}</div>
      <h2 className="mt-2">{title}</h2>
    </div>
  );
}

function StatBlock({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "up" | "down" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-white";
  return (
    <div className="bg-canvas-raised p-7">
      <div className="label">{label}</div>
      <div className={`display-num mt-3 text-[2.6rem] ${c}`}>{value}</div>
      <div className="mt-2 text-[12px] text-slate-500">{sub}</div>
    </div>
  );
}
