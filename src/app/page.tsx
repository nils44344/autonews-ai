import Link from "next/link";
import { prisma } from "@/lib/db";
import { TOP_BRANDS } from "@/lib/brands";
import { CATEGORIES } from "@/lib/categories";
import { formatUsd, formatSigned } from "@/lib/format";
import { datasetSchema, ldScript } from "@/lib/jsonld";
import { env } from "@/lib/env";

export const revalidate = 300;

export default async function HomePage() {
  // Pull data in parallel
  const [latestSentiments, latestPredictions, brandCount] = await Promise.all([
    prisma.brandSentiment.findMany({ orderBy: { asOf: "desc" }, take: 50, include: { brand: true } }).catch(() => []),
    prisma.pricePrediction.findMany({ orderBy: { asOf: "desc" }, take: 50, include: { brand: true } }).catch(() => []),
    prisma.brand.count().catch(() => 0),
  ]);

  // Latest sentiment per brand
  const latestByBrand = new Map<string, typeof latestSentiments[number]>();
  for (const s of latestSentiments) if (!latestByBrand.has(s.brandId)) latestByBrand.set(s.brandId, s);
  const sentiments = Array.from(latestByBrand.values());

  // Top 3 by sentiment + top 3 movers (biggest price delta)
  const topSentiment = [...sentiments].sort((a, b) => b.score - a.score).slice(0, 3);
  const movers = [...latestPredictions]
    .map((p) => ({ ...p, deltaPct: ((p.predictedPriceUsd - p.currentPriceUsd) / p.currentPriceUsd) * 100 }))
    .sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct))
    .slice(0, 4);

  // Headline stats
  const avgSentiment = sentiments.length ? sentiments.reduce((a, s) => a + s.score, 0) / sentiments.length : 0;
  const totalMentions = sentiments.reduce((a, s) => a + s.mentionCount, 0);

  const ld = datasetSchema({
    name: "AutoNews AI — Predictive Automotive Market Intelligence",
    description: "AI-driven brand sentiment, 30-day price predictions, and category trends for the 50 most-watched car brands.",
    url: env.SITE_URL,
    keywords: ["automotive market", "AI sentiment", "EV forecast", "car price prediction"],
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(ld) }} />

      {/* HERO ─────────────────────────────────────────── */}
      <section className="relative isolate mb-24 pb-12 sm:mb-32">
        <div className="absolute inset-0 -z-10 aurora" aria-hidden />
        <div className="label label-brand">Predictive Market Intelligence</div>
        <h1 className="mt-5 max-w-4xl text-white">
          Read the automotive market <span className="text-brand">before it moves.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-400 sm:text-[16px]">
          AI-driven sentiment scoring, 30-day price predictions, and category forecasts for the 50 most-watched global car brands. Refreshed every cycle from real public signal.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/trends/tesla" className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-[13px] font-semibold text-black transition hover:brightness-105">
            Explore brand trends →
          </Link>
          <Link href="/predictions/ev" className="inline-flex h-11 items-center gap-2 rounded-lg border border-canvas-rule px-5 text-[13px] font-semibold text-white transition hover:border-brand/40 hover:text-brand">
            EV forecast
          </Link>
        </div>

        {/* Stat strip */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-xl border border-canvas-rule bg-canvas-rule sm:grid-cols-3">
          <StatBlock label="Brands tracked" value={brandCount.toString()} sub={`${TOP_BRANDS.length} in catalog`} />
          <StatBlock
            label="Avg sentiment"
            value={`${avgSentiment >= 0 ? "+" : ""}${avgSentiment.toFixed(0)}`}
            sub={avgSentiment >= 0 ? "Net positive" : "Net negative"}
            tone={avgSentiment >= 0 ? "up" : "down"}
          />
          <StatBlock
            label="Mentions / 24h"
            value={totalMentions > 1e6 ? `${(totalMentions / 1e6).toFixed(1)}M` : totalMentions > 1e3 ? `${(totalMentions / 1e3).toFixed(0)}k` : totalMentions.toString()}
            sub="Live signal"
          />
        </div>
      </section>

      {/* FEATURED — TOP MOVERS ─────────────────────────── */}
      {movers.length > 0 && (
        <section className="mb-24">
          <SectionHead label="01 / Top Movers" title="Where price is going in the next 30 days." trailing={<Link href="/predictions/ev" className="text-[12px] text-slate-500 hover:text-white">All forecasts →</Link>} />
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-canvas-rule bg-canvas-rule sm:grid-cols-2 lg:grid-cols-4">
            {movers.map((m) => {
              const up = m.deltaPct >= 0;
              return (
                <Link key={m.id} href={`/trends/${m.brand.slug}`} className="group bg-canvas-raised p-6 transition hover:bg-canvas-elevated">
                  <div className="label">{m.brand.name} · {m.category}</div>
                  <div className="mt-1 text-[15px] font-semibold">{m.modelName}</div>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className={`display-num text-[2.8rem] ${up ? "text-up" : "text-down"}`}>
                      {formatSigned(m.deltaPct)}%
                    </span>
                  </div>
                  <div className="mt-2 text-[12px] text-slate-500">
                    {formatUsd(m.currentPriceUsd)} → {formatUsd(m.predictedPriceUsd)}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FEATURED — SENTIMENT LEADERS ──────────────────── */}
      {topSentiment.length > 0 && (
        <section className="mb-24">
          <SectionHead label="02 / Sentiment Leaders" title="Brands the market loves right now." trailing={<Link href="/trends/tesla" className="text-[12px] text-slate-500 hover:text-white">All brands →</Link>} />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {topSentiment.map((s, i) => (
              <Link key={s.id} href={`/trends/${s.brand.slug}`} className="surface group p-7 transition hover:border-brand/30">
                <div className="flex items-start justify-between">
                  <div className="label">#{String(i + 1).padStart(2, "0")}</div>
                  <div className="label">{s.brand.country}</div>
                </div>
                <h3 className="mt-4 text-[1.75rem] font-bold leading-tight">{s.brand.name}</h3>
                <div className="mt-8 flex items-baseline gap-3">
                  <span className={`display-num text-[3.2rem] ${s.score >= 33 ? "text-up" : s.score <= -33 ? "text-down" : "text-warn"}`}>
                    {s.score >= 0 ? "+" : ""}{s.score.toFixed(0)}
                  </span>
                  <span className="label">sentiment</span>
                </div>
                <div className="mt-6 flex flex-wrap gap-1.5">
                  {s.topTopics.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full border border-canvas-rule bg-canvas px-2.5 py-0.5 text-[11px] text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CATEGORIES ─────────────────────────────────────── */}
      <section className="mb-24">
        <SectionHead label="03 / Categories" title="Forecasts by segment." />
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-canvas-rule bg-canvas-rule sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/predictions/${c.slug}`} className="group bg-canvas-raised p-6 transition hover:bg-canvas-elevated">
              <div className="label label-brand">{c.slug.toUpperCase()}</div>
              <div className="mt-2 text-[1.05rem] font-semibold">{c.name}</div>
              <p className="mt-2 line-clamp-2 text-[12px] text-slate-500">{c.description}</p>
              <div className="mt-4 text-[12px] text-brand opacity-0 transition group-hover:opacity-100">View forecast →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* BRAND DIRECTORY ────────────────────────────────── */}
      <section>
        <SectionHead label="04 / Brand Directory" title={`${TOP_BRANDS.length} global brands tracked.`} />
        <ul className="mt-10 grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TOP_BRANDS.map((b) => (
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

function SectionHead({ label, title, trailing }: { label: string; title: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-6 border-b border-canvas-rule pb-4">
      <div>
        <div className="label label-brand">{label}</div>
        <h2 className="mt-2">{title}</h2>
      </div>
      {trailing}
    </div>
  );
}

function StatBlock({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "up" | "down" }) {
  const c = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-white";
  return (
    <div className="bg-canvas-raised p-7">
      <div className="label">{label}</div>
      <div className={`display-num mt-3 text-[3.5rem] ${c}`}>{value}</div>
      <div className="mt-2 text-[12px] text-slate-500">{sub}</div>
    </div>
  );
}
