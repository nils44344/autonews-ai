import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { TOP_BRANDS } from "@/lib/brands";
import { CATEGORIES } from "@/lib/categories";
import { formatUsd, formatSigned, dateShort } from "@/lib/format";
import { SkeletonChart, SkeletonRow } from "@/components/SkeletonChart";
import { Watchlist } from "@/components/Watchlist";
import { datasetSchema, ldScript } from "@/lib/jsonld";
import { env } from "@/lib/env";

// Server Component — fetches market data + renders dashboard entirely on
// server. Zero heavy JS shipped to the client. Watchlist is the only
// client component on the page (interactivity isolated).

export const revalidate = 300; // ISR: 5 min

export default async function HomePage() {
  const ld = datasetSchema({
    name: "AutoNews AI — Predictive Automotive Market Dashboard",
    description: "Live AI-driven dashboard tracking brand sentiment, 30-day price predictions, EV adoption, and category trends across the top 50 global car brands.",
    url: env.SITE_URL,
    keywords: ["automotive market", "AI sentiment", "EV forecast", "car price prediction"],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(ld) }} />

      {/* HERO ─────────────────────────────────────────── */}
      <section className="relative -mx-4 mb-12 overflow-hidden border-b border-canvas-rule px-4 pb-10 pt-10 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 md:pb-14 md:pt-14">
        <div className="absolute inset-0 -z-10 grid-bg" />
        <div className="mx-auto max-w-content">
          <p className="bracket text-brand">[ AI · AUTOMOTIVE · TERMINAL ]</p>
          <h1 className="mt-4 max-w-4xl text-white">
            Predictive automotive market dashboard.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] text-slate-400">
            AI-driven sentiment, 30-day price predictions, and category forecasts for the top 50 global car brands. Refreshed every cycle. Used by analysts, dealers, and enthusiasts to read the market early.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/trends/tesla" className="inline-flex h-10 items-center rounded-md bg-brand px-4 font-mono text-[12px] font-bold uppercase tracking-bracket text-black hover:brightness-95">
              [→] BRAND TRENDS
            </Link>
            <Link href="/predictions/ev" className="inline-flex h-10 items-center rounded-md border border-canvas-rule bg-canvas-raised px-4 font-mono text-[12px] font-bold uppercase tracking-bracket text-white hover:border-brand/40 hover:text-brand">
              EV FORECAST
            </Link>
          </div>
        </div>
      </section>

      {/* DASHBOARD GRID ───────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-10">
          <Suspense fallback={<SkeletonChart height={300} />}>
            <TopMoversPanel />
          </Suspense>

          <Suspense fallback={<SkeletonChart height={260} />}>
            <SentimentLeaderboard />
          </Suspense>

          <CategoryGrid />

          <Suspense fallback={<SkeletonChart height={300} />}>
            <BrandGrid />
          </Suspense>
        </div>

        <aside className="space-y-6">
          <Watchlist />
          <DataNote />
        </aside>
      </div>
    </>
  );
}

// ── Server components ─────────────────────────────────

async function TopMoversPanel() {
  const recent = await prisma.pricePrediction.findMany({
    orderBy: { asOf: "desc" },
    take: 6,
    include: { brand: true },
  }).catch(() => []);

  return (
    <section aria-labelledby="movers-h" className="card">
      <header className="flex items-center justify-between border-b border-canvas-rule px-5 py-3">
        <h2 id="movers-h" className="bracket text-brand">[ 01 · TOP MOVERS · 30D ]</h2>
        <span className="bracket">PRICE FORECAST</span>
      </header>
      {recent.length === 0 ? (
        <EmptyPanel msg="Predictions populate on first ingest." />
      ) : (
        <ul className="divide-y divide-canvas-rule">
          {recent.map((p) => {
            const delta = p.predictedPriceUsd - p.currentPriceUsd;
            const pct = (delta / p.currentPriceUsd) * 100;
            const up = delta >= 0;
            return (
              <li key={p.id}>
                <Link href={`/trends/${p.brand.slug}`} className="flex items-center gap-4 px-5 py-3 hover:bg-canvas-elevated">
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{p.brand.name} · {p.modelName}</div>
                    <div className="bracket mt-0.5">{p.category}</div>
                  </div>
                  <div className="text-right font-mono tnum">
                    <div className="text-[12px] text-slate-500">{formatUsd(p.currentPriceUsd)}</div>
                    <div className={`text-[14px] font-bold ${up ? "text-up" : "text-down"}`}>
                      {formatUsd(p.predictedPriceUsd)}
                    </div>
                    <div className={`text-[11px] ${up ? "text-up" : "text-down"}`}>{formatSigned(pct)}%</div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

async function SentimentLeaderboard() {
  const top = await prisma.brandSentiment.findMany({
    orderBy: [{ asOf: "desc" }],
    take: 50,
    include: { brand: true },
  }).catch(() => []);

  // Dedup to latest per brand
  const latest = new Map<string, typeof top[number]>();
  for (const s of top) if (!latest.has(s.brandId)) latest.set(s.brandId, s);
  const ranked = Array.from(latest.values()).sort((a, b) => b.score - a.score).slice(0, 8);

  return (
    <section aria-labelledby="senti-h" className="card">
      <header className="flex items-center justify-between border-b border-canvas-rule px-5 py-3">
        <h2 id="senti-h" className="bracket text-brand">[ 02 · SENTIMENT LEADERBOARD ]</h2>
        <span className="bracket">AI · LIVE</span>
      </header>
      {ranked.length === 0 ? (
        <EmptyPanel msg="Sentiment scores populate after the first ingest." />
      ) : (
        <ol className="divide-y divide-canvas-rule">
          {ranked.map((s, i) => (
            <li key={s.id}>
              <Link href={`/trends/${s.brand.slug}`} className="flex items-center gap-4 px-5 py-3 hover:bg-canvas-elevated">
                <span className="w-8 font-mono text-[11px] text-slate-500">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 text-[14px] font-semibold">{s.brand.name}</span>
                <div className="flex items-center gap-3">
                  <Bar value={s.score} />
                  <span className={`w-12 text-right font-mono text-[13px] font-bold tnum ${s.score >= 33 ? "text-up" : s.score <= -33 ? "text-down" : "text-accent"}`}>
                    {s.score >= 0 ? "+" : ""}{s.score.toFixed(0)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Bar({ value }: { value: number }) {
  const w = ((Math.max(-100, Math.min(100, value)) + 100) / 200) * 100;
  return (
    <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-canvas-elevated sm:block">
      <div className="h-full rounded-full" style={{
        width: `${w}%`,
        background: value >= 33 ? "rgb(var(--up))" : value <= -33 ? "rgb(var(--down))" : "rgb(var(--accent))",
      }} />
    </div>
  );
}

function CategoryGrid() {
  return (
    <section aria-labelledby="cat-h">
      <h2 id="cat-h" className="bracket text-brand mb-4">[ 03 · CATEGORY FORECASTS ]</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link href={`/predictions/${c.slug}`} className="card block p-4 hover:border-brand/40">
              <div className="bracket text-brand">[ {c.slug.toUpperCase()} ]</div>
              <div className="mt-2 text-[15px] font-semibold">{c.name}</div>
              <p className="mt-1 line-clamp-2 text-[12px] text-slate-400">{c.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

async function BrandGrid() {
  const dbBrands = await prisma.brand.findMany({
    select: { slug: true, name: true, country: true },
    orderBy: { name: "asc" },
  }).catch(() => []);
  const merged = TOP_BRANDS.map((b) => ({
    ...b,
    inDb: dbBrands.some((d) => d.slug === b.slug),
  }));

  return (
    <section aria-labelledby="brand-h">
      <h2 id="brand-h" className="bracket text-brand mb-4">[ 04 · BRAND DIRECTORY · {merged.length} ]</h2>
      <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {merged.map((b) => (
          <li key={b.slug}>
            <Link href={`/trends/${b.slug}`} className="card flex items-center justify-between px-3 py-2 hover:border-brand/40">
              <span className="text-[13px] font-semibold">{b.name}</span>
              <span className="bracket">{b.country.slice(0, 3).toUpperCase()}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DataNote() {
  return (
    <section className="card p-4">
      <h3 className="bracket text-brand">[ DATA · NOTE ]</h3>
      <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
        Predictions combine real-time sentiment, inventory signals, and historical price elasticity. Updated every ingest cycle. Last refresh: {dateShort(new Date())}.
      </p>
    </section>
  );
}

function EmptyPanel({ msg }: { msg: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-[13px] text-slate-500">{msg}</p>
      <ol className="mx-auto mt-3 grid max-w-md gap-1.5">
        {[0, 1, 2].map((i) => <SkeletonRow key={i} height={36} />)}
      </ol>
    </div>
  );
}
