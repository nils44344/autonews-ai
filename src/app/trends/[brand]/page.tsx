import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { TOP_BRANDS, findBrand } from "@/lib/brands";
import { formatUsd, formatSigned, dateShort } from "@/lib/format";
import { PriceChart } from "@/components/PriceChart";
import { Watchlist } from "@/components/Watchlist";
import {
  datasetSchema, newsArticleSchema, productAggregateOfferSchema,
  breadcrumbSchema, ldScript,
} from "@/lib/jsonld";

export const revalidate = 600;

export function generateStaticParams() {
  return TOP_BRANDS.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params;
  const seed = findBrand(brand);
  if (!seed) return { title: "Brand not found" };
  const title = `${seed.name} · Market Sentiment & 30-Day Price Forecast`;
  const description = `Live AI-driven sentiment, 30-day price predictions, and market trends for ${seed.name}. Refreshed every cycle.`;
  return {
    title, description,
    keywords: [`${seed.name} forecast`, `${seed.name} sentiment`, `${seed.name} price prediction`, `${seed.name} market`],
    alternates: { canonical: `${env.SITE_URL}/trends/${brand}` },
    openGraph: { type: "article", title, description, url: `${env.SITE_URL}/trends/${brand}`, siteName: env.SITE_NAME },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  const seed = findBrand(brand);
  if (!seed) notFound();

  const dbBrand = await prisma.brand.findUnique({
    where: { slug: brand },
    include: {
      sentiments:  { orderBy: { asOf: "desc" }, take: 30 },
      predictions: { orderBy: { asOf: "desc" }, take: 30 },
    },
  });

  const sentimentHistory = dbBrand?.sentiments ?? [];
  const currentSentiment = sentimentHistory[0];
  const sentimentTrend = sentimentHistory.length > 1
    ? currentSentiment!.score - sentimentHistory[sentimentHistory.length - 1].score
    : 0;

  // Dedup predictions to latest per model
  const byModel = new Map<string, typeof dbBrand extends null ? never : NonNullable<typeof dbBrand>["predictions"][number]>();
  for (const p of (dbBrand?.predictions ?? [])) if (!byModel.has(p.modelName)) byModel.set(p.modelName, p);
  const predictions = Array.from(byModel.values());
  const featured = predictions[0];
  const others = predictions.slice(1);

  const url = `${env.SITE_URL}/trends/${brand}`;
  const ld = [
    datasetSchema({
      name: `${seed.name} — Automotive Market Dataset`,
      description: `Sentiment scores and 30-day price predictions for ${seed.name}.`,
      url,
      keywords: [seed.name, "sentiment", "price prediction"],
    }),
    newsArticleSchema({
      headline: `${seed.name} · Market Sentiment & 30-Day Forecast`,
      description: `AI-driven analysis of ${seed.name}.`,
      url,
      datePublished: currentSentiment?.asOf ?? new Date(),
      dateModified: dbBrand?.updatedAt ?? new Date(),
    }),
    breadcrumbSchema([
      { name: "Home", url: env.SITE_URL },
      { name: "Brands", url: `${env.SITE_URL}/trends/${brand}` },
      { name: seed.name, url },
    ]),
    ...(featured ? [productAggregateOfferSchema({
      name: `${seed.name} ${featured.modelName}`,
      description: `${featured.category} · predicted ${formatUsd(featured.predictedPriceUsd)} in ${featured.horizonDays} days`,
      url, brandName: seed.name,
      lowPrice: featured.lowUsd, highPrice: featured.highUsd, averagePrice: featured.predictedPriceUsd,
    })] : []),
  ];

  return (
    <>
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(obj) }} />
      ))}

      <nav aria-label="Breadcrumb" className="mb-10 flex items-center gap-2 text-[12px] text-slate-500">
        <Link href="/" className="hover:text-white">Home</Link><span>/</span>
        <span className="text-slate-400">Brands</span><span>/</span>
        <span className="text-brand">{seed.name}</span>
      </nav>

      {/* HERO ─────────────────────────────────────── */}
      <header className="relative isolate mb-20 pb-10">
        <div className="absolute inset-0 -z-10 aurora" aria-hidden />
        <div className="label label-brand">Brand · {seed.country} · Founded {seed.founded}</div>
        <h1 className="mt-4 text-white">{seed.name}</h1>
        <p className="mt-5 max-w-xl text-[15px] text-slate-400">
          Live AI-driven sentiment, 30-day price predictions, and market trends. Refreshed continuously from real public signal.
        </p>

        {currentSentiment && (
          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-canvas-rule bg-canvas-rule sm:grid-cols-3">
            <StatBlock
              label="Sentiment"
              value={`${currentSentiment.score >= 0 ? "+" : ""}${currentSentiment.score.toFixed(0)}`}
              sub={`${sentimentTrend >= 0 ? "↑" : "↓"} ${Math.abs(sentimentTrend).toFixed(0)} pts (30d)`}
              tone={currentSentiment.score >= 33 ? "up" : currentSentiment.score <= -33 ? "down" : undefined}
            />
            <StatBlock
              label="Mentions"
              value={currentSentiment.mentionCount > 1e6
                ? `${(currentSentiment.mentionCount / 1e6).toFixed(1)}M`
                : currentSentiment.mentionCount > 1e3
                ? `${(currentSentiment.mentionCount / 1e3).toFixed(0)}k`
                : currentSentiment.mentionCount.toString()}
              sub="Last 7 days"
            />
            <StatBlock
              label="Positive"
              value={`${currentSentiment.positivePct.toFixed(0)}%`}
              sub={`vs ${currentSentiment.negativePct.toFixed(0)}% negative`}
              tone="up"
            />
          </div>
        )}
      </header>

      {/* FEATURED PREDICTION ─────────────────────── */}
      {featured && (
        <section className="mb-24">
          <SectionHead label="01 / Featured Forecast" title={`${featured.modelName}`} />
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_auto]">
            <div className="surface p-7">
              <div className="label">{featured.category} · {featured.horizonDays}-day horizon</div>
              <div className="mt-5 flex flex-wrap items-baseline gap-6">
                <div>
                  <div className="label">Current</div>
                  <div className="display-num mt-2 text-[3.5rem] tnum">{formatUsd(featured.currentPriceUsd)}</div>
                </div>
                <div className="text-slate-600">→</div>
                <div>
                  <div className="label">Predicted</div>
                  <div className={`display-num mt-2 text-[3.5rem] tnum ${featured.predictedPriceUsd >= featured.currentPriceUsd ? "text-up" : "text-down"}`}>
                    {formatUsd(featured.predictedPriceUsd)}
                  </div>
                </div>
                <div>
                  <div className="label">Δ</div>
                  <div className={`display-num mt-2 text-[3.5rem] ${featured.predictedPriceUsd >= featured.currentPriceUsd ? "text-up" : "text-down"}`}>
                    {formatSigned(((featured.predictedPriceUsd - featured.currentPriceUsd) / featured.currentPriceUsd) * 100)}%
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <PriceChart current={featured.currentPriceUsd} predicted={featured.predictedPriceUsd} low={featured.lowUsd} high={featured.highUsd} height={240} />
              </div>
              <div className="mt-6 flex items-center gap-6 text-[12px] text-slate-500">
                <span>Confidence · <span className="text-white">{featured.confidence.toFixed(0)}%</span></span>
                <span>Range · <span className="text-white">{formatUsd(featured.lowUsd)} – {formatUsd(featured.highUsd)}</span></span>
                <span>As of · {dateShort(featured.asOf)}</span>
              </div>
            </div>
            <Watchlist brandSlug={brand} brandName={seed.name} modelName={featured.modelName} />
          </div>
        </section>
      )}

      {/* OTHER PREDICTIONS ───────────────────────── */}
      {others.length > 0 && (
        <section className="mb-24">
          <SectionHead label="02 / Other Forecasts" title={`${others.length} more models tracked.`} />
          <ul className="mt-10 grid gap-1">
            {others.map((p) => {
              const delta = ((p.predictedPriceUsd - p.currentPriceUsd) / p.currentPriceUsd) * 100;
              const up = delta >= 0;
              return (
                <li key={p.id}>
                  <div className="grid grid-cols-[1fr_auto_auto] items-center gap-8 border-b border-canvas-rule py-5 transition hover:border-brand/30">
                    <div>
                      <div className="text-[15px] font-semibold">{p.modelName}</div>
                      <div className="label mt-1">{p.category} · confidence {p.confidence.toFixed(0)}%</div>
                    </div>
                    <div className="hidden font-mono text-[13px] text-slate-500 sm:block tnum">
                      {formatUsd(p.currentPriceUsd)} → <span className="text-white">{formatUsd(p.predictedPriceUsd)}</span>
                    </div>
                    <div className={`text-right font-mono text-[18px] font-bold tnum ${up ? "text-up" : "text-down"}`}>
                      {formatSigned(delta)}%
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* TOP TOPICS ──────────────────────────────── */}
      {currentSentiment?.topTopics && currentSentiment.topTopics.length > 0 && (
        <section className="mb-24">
          <SectionHead label="03 / Conversation" title="What the market is talking about." />
          <div className="mt-10 flex flex-wrap gap-2">
            {currentSentiment.topTopics.map((t) => (
              <span key={t} className="rounded-full border border-canvas-rule bg-canvas-raised px-4 py-2 text-[13px] text-slate-300">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* RELATED BRANDS ──────────────────────────── */}
      <section>
        <SectionHead label="04 / Related Brands" title="More you might watch." />
        <ul className="mt-10 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {TOP_BRANDS.filter((b) => b.slug !== brand).slice(0, 9).map((b) => (
            <li key={b.slug}>
              <Link href={`/trends/${b.slug}`} className="flex items-center justify-between border-b border-canvas-rule py-3 transition hover:border-brand/30 hover:text-brand">
                <span className="text-[14px] font-medium">{b.name}</span>
                <span className="text-[11px] text-slate-600">{b.country}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
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
      <div className={`display-num mt-3 text-[3rem] ${c}`}>{value}</div>
      <div className="mt-2 text-[12px] text-slate-500">{sub}</div>
    </div>
  );
}
