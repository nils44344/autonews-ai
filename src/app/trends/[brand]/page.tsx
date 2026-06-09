import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { TOP_BRANDS, findBrand } from "@/lib/brands";
import { formatUsd, formatSigned, dateShort } from "@/lib/format";
import { SentimentGauge } from "@/components/SentimentGauge";
import { PriceChart } from "@/components/PriceChart";
import { Watchlist } from "@/components/Watchlist";
import {
  datasetSchema, newsArticleSchema, productAggregateOfferSchema,
  breadcrumbSchema, ldScript,
} from "@/lib/jsonld";

export const revalidate = 600;

// Pre-render every top brand at build time. Instant FCP, perfect Lighthouse.
export function generateStaticParams() {
  return TOP_BRANDS.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const { brand } = await params;
  const seed = findBrand(brand);
  if (!seed) return { title: "Brand not found" };

  const title = `${seed.name} AI Market Sentiment & 30-Day Price Forecast`;
  const description = `Live AI-driven sentiment, 30-day price predictions, and market trends for ${seed.name} across EV, SUV, sedan, and hybrid segments. Updated continuously.`;
  return {
    title,
    description,
    keywords: [
      `${seed.name} price prediction`,
      `${seed.name} sentiment`,
      `${seed.name} forecast`,
      `${seed.name} market trend`,
      `${seed.name} stock impact`,
      `${seed.name} AI analysis`,
    ],
    alternates: { canonical: `${env.SITE_URL}/trends/${brand}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${env.SITE_URL}/trends/${brand}`,
      siteName: env.SITE_NAME,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BrandTrendPage({ params }: { params: Promise<{ brand: string }> }) {
  const { brand } = await params;
  const seed = findBrand(brand);
  if (!seed) notFound();

  const dbBrand = await prisma.brand.findUnique({
    where: { slug: brand },
    include: {
      sentiments:  { orderBy: { asOf: "desc" }, take: 1 },
      predictions: { orderBy: { asOf: "desc" }, take: 6 },
    },
  });

  const sentiment = dbBrand?.sentiments[0];
  const predictions = dbBrand?.predictions ?? [];
  const featured = predictions[0];

  const url = `${env.SITE_URL}/trends/${brand}`;
  const ld = [
    datasetSchema({
      name: `${seed.name} — Automotive Market Dataset`,
      description: `Live sentiment scores, mention volume, and 30-day price predictions for ${seed.name} vehicles.`,
      url,
      keywords: [seed.name, "sentiment", "price prediction", "automotive market"],
      variableMeasured: ["sentiment score", "mention count", "predicted price USD", "confidence interval"],
    }),
    newsArticleSchema({
      headline: `${seed.name} AI Market Sentiment & 30-Day Price Forecast`,
      description: `AI-driven analysis of ${seed.name} market position, sentiment, and price trajectory.`,
      url,
      datePublished: sentiment?.asOf ?? new Date(),
      dateModified: dbBrand?.updatedAt ?? new Date(),
    }),
    breadcrumbSchema([
      { name: "Home", url: env.SITE_URL },
      { name: "Trends", url: `${env.SITE_URL}/trends/${brand}` },
      { name: seed.name, url },
    ]),
    ...(featured ? [productAggregateOfferSchema({
      name: `${seed.name} ${featured.modelName}`,
      description: `${featured.category} · 30-day predicted price ${formatUsd(featured.predictedPriceUsd)}`,
      url,
      brandName: seed.name,
      lowPrice: featured.lowUsd,
      highPrice: featured.highUsd,
      averagePrice: featured.predictedPriceUsd,
    })] : []),
  ];

  return (
    <>
      {ld.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(obj) }} />
      ))}

      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-[12px] text-slate-500">
        <Link href="/" className="hover:text-white">Home</Link>
        <span>/</span>
        <span className="text-white">Trends</span>
        <span>/</span>
        <span className="text-brand">{seed.name}</span>
      </nav>

      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-canvas-rule pb-8">
        <div>
          <p className="bracket text-brand">[ BRAND · {seed.country.toUpperCase()} · FOUNDED {seed.founded} ]</p>
          <h1 className="mt-3 text-white">{seed.name}</h1>
          <p className="mt-3 max-w-xl text-[14px] text-slate-400">
            AI-driven sentiment and 30-day price predictions for {seed.name}. Updated continuously from market signals.
          </p>
        </div>
        {sentiment && <SentimentGauge score={sentiment.score} />}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <SentimentPanel sentiment={sentiment} brandName={seed.name} />
          <PredictionPanel predictions={predictions} brandSlug={brand} brandName={seed.name} />
        </div>

        <aside className="space-y-6">
          <Watchlist brandSlug={brand} brandName={seed.name} modelName={featured?.modelName} />
          <RelatedBrands current={brand} />
        </aside>
      </div>
    </>
  );
}

function SentimentPanel({ sentiment, brandName }: {
  sentiment: { score: number; mentionCount: number; positivePct: number; negativePct: number; neutralPct: number; topTopics: string[]; asOf: Date } | undefined;
  brandName: string;
}) {
  if (!sentiment) {
    return (
      <section aria-labelledby="senti-h" className="card p-6">
        <h2 id="senti-h" className="bracket text-brand">[ 01 · SENTIMENT ]</h2>
        <p className="mt-3 text-[13px] text-slate-500">No sentiment data yet for {brandName}. First ingest will populate this panel.</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="senti-h" className="card p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 id="senti-h" className="bracket text-brand">[ 01 · SENTIMENT ]</h2>
        <span className="bracket">{dateShort(sentiment.asOf)}</span>
      </header>
      <div className="grid gap-6 sm:grid-cols-3">
        <Stat label="Score"    value={`${sentiment.score >= 0 ? "+" : ""}${sentiment.score.toFixed(0)}`} tone={sentiment.score >= 33 ? "up" : sentiment.score <= -33 ? "down" : "amber"} />
        <Stat label="Mentions" value={sentiment.mentionCount.toLocaleString()} />
        <Stat label="Positive" value={`${sentiment.positivePct.toFixed(0)}%`} tone="up" />
      </div>
      {sentiment.topTopics.length > 0 && (
        <div className="mt-6">
          <div className="bracket">[ TOP TOPICS ]</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sentiment.topTopics.map((t) => (
              <span key={t} className="rounded border border-canvas-rule bg-canvas-elevated px-2 py-1 font-mono text-[11px] uppercase tracking-wider">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function PredictionPanel({ predictions, brandSlug, brandName }: {
  predictions: { id: string; modelName: string; category: string; currentPriceUsd: number; predictedPriceUsd: number; lowUsd: number; highUsd: number; confidence: number; trend: string; horizonDays: number; asOf: Date }[];
  brandSlug: string;
  brandName: string;
}) {
  if (predictions.length === 0) {
    return (
      <section aria-labelledby="pred-h" className="card p-6">
        <h2 id="pred-h" className="bracket text-brand">[ 02 · PRICE PREDICTIONS ]</h2>
        <p className="mt-3 text-[13px] text-slate-500">No price predictions yet for {brandName}.</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="pred-h" className="card">
      <header className="flex items-center justify-between border-b border-canvas-rule px-6 py-4">
        <h2 id="pred-h" className="bracket text-brand">[ 02 · PRICE PREDICTIONS · 30D ]</h2>
        <span className="bracket">{predictions.length} MODELS</span>
      </header>
      <div className="divide-y divide-canvas-rule">
        {predictions.map((p) => {
          const delta = p.predictedPriceUsd - p.currentPriceUsd;
          const pct = (delta / p.currentPriceUsd) * 100;
          const up = delta >= 0;
          return (
            <article key={p.id} className="grid gap-6 px-6 py-5 lg:grid-cols-[1fr_auto]" itemScope itemType="https://schema.org/Product">
              <div>
                <meta itemProp="brand" content={brandName} />
                <meta itemProp="category" content={p.category} />
                <h3 itemProp="name" className="text-[16px] font-bold">{brandName} {p.modelName}</h3>
                <div className="bracket mt-1">[ {p.category} · CONF {p.confidence.toFixed(0)}% · {p.horizonDays}D ]</div>
                <div className="mt-4 grid grid-cols-3 gap-4 max-w-md">
                  <Stat label="Current"   value={formatUsd(p.currentPriceUsd)} />
                  <Stat label="Predicted" value={formatUsd(p.predictedPriceUsd)} tone={up ? "up" : "down"} />
                  <Stat label="Delta"     value={`${formatSigned(pct)}%`} tone={up ? "up" : "down"} />
                </div>
                <link itemProp="url" href={`${process.env.SITE_URL ?? ""}/trends/${brandSlug}`} />
              </div>
              <div className="w-full max-w-md">
                <PriceChart current={p.currentPriceUsd} predicted={p.predictedPriceUsd} low={p.lowUsd} high={p.highUsd} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RelatedBrands({ current }: { current: string }) {
  const related = TOP_BRANDS.filter((b) => b.slug !== current).slice(0, 6);
  return (
    <section className="card p-4">
      <h3 className="bracket text-brand">[ RELATED · BRANDS ]</h3>
      <ul className="mt-3 space-y-1.5">
        {related.map((b) => (
          <li key={b.slug}>
            <Link href={`/trends/${b.slug}`} className="flex items-center justify-between rounded border border-canvas-rule px-3 py-2 hover:border-brand/40">
              <span className="text-[13px] font-medium">{b.name}</span>
              <span className="bracket">{b.country.slice(0, 3).toUpperCase()}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "amber" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : tone === "amber" ? "text-accent" : "text-white";
  return (
    <div>
      <div className="bracket">[ {label.toUpperCase()} ]</div>
      <div className={`mt-1 font-mono text-[18px] font-bold tnum ${c}`}>{value}</div>
    </div>
  );
}
