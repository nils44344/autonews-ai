import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const revalidate = 600;

interface SignalRow { label: string; value: string; direction: "up" | "down" | "flat" }

const STAGE_LABEL: Record<string, string> = {
  PRESEED: "Pre-seed", SEED: "Seed", SERIES_A: "Series A", SERIES_B: "Series B",
  SERIES_C_PLUS: "Series C+", PUBLIC: "Public", ACQUIRED: "Acquired", BOOTSTRAPPED: "Bootstrapped",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = await prisma.startup.findUnique({
    where: { slug },
    select: { name: true, tagline: true, seoTitle: true, seoDescription: true, status: true, ogImage: true },
  });
  if (!s || s.status !== "PUBLISHED") return { title: "Startup not found" };
  return {
    title: s.seoTitle ?? `${s.name} — ${s.tagline}`,
    description: s.seoDescription ?? s.tagline,
    alternates: { canonical: `${env.SITE_URL}/startups/${slug}` },
    openGraph: { type: "article", images: s.ogImage ? [s.ogImage] : undefined },
  };
}

export default async function StartupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await prisma.startup.findUnique({ where: { slug } });
  if (!s || s.status !== "PUBLISHED") notFound();

  prisma.startup.update({ where: { id: s.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const signals = Array.isArray(s.signals) ? (s.signals as unknown as SignalRow[]) : [];

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <Link href="/startups" className="text-xs font-semibold uppercase tracking-wider text-rose-600 hover:underline dark:text-rose-400">
          ← All Startups
        </Link>
        <div className="flex items-center gap-2">
          {s.isBreakout && (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Breakout</span>
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {STAGE_LABEL[s.stage] ?? s.stage}
          </span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
          {s.name}
        </h1>
        {s.hq && <div className="text-sm text-slate-500">{s.hq}{s.founded ? ` · founded ${s.founded}` : ""}</div>}
        <p className="max-w-3xl text-lg text-slate-700 dark:text-slate-300">{s.tagline}</p>
        {s.url && (
          <a href={s.url} target="_blank" rel="noopener nofollow"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
            Visit site ↗
          </a>
        )}
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Momentum" value={s.momentumScore.toFixed(0)} />
        {s.totalRaisedUsd && s.totalRaisedUsd > 0 && (
          <Stat label="Total raised" value={`$${s.totalRaisedUsd.toFixed(0)}M`} />
        )}
        {s.lastRoundUsd && s.lastRoundUsd > 0 && (
          <Stat label="Last round" value={`$${s.lastRoundUsd.toFixed(0)}M`} />
        )}
      </section>

      <Block title="What they do">{s.description}</Block>
      <Block title="Why it matters">{s.whyItMatters}</Block>

      {s.investors.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-slate-900 dark:text-white">Investors</h2>
          <div className="flex flex-wrap gap-2">
            {s.investors.map((inv) => (
              <span key={inv} className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {inv}
              </span>
            ))}
          </div>
        </section>
      )}

      {signals.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-slate-900 dark:text-white">Signals</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {signals.map((sig, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <div className="text-xs text-slate-500">{sig.label}</div>
                  <div className="mt-1 font-bold text-slate-900 dark:text-white">{sig.value}</div>
                </div>
                <span className={sig.direction === "up" ? "text-emerald-500" : sig.direction === "down" ? "text-rose-500" : "text-slate-500"}>
                  {sig.direction === "up" ? "↑" : sig.direction === "down" ? "↓" : "→"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</div>
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
