import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { PillarHero } from "@/components/PillarHero";

// Pillar 3 — Tools. Editorial registry painted in tool cyan. Ranked by
// momentum so what's growing fastest floats to the top.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Tools — what's growing fastest",
  description: "Curated AI tools with editorial context. Rankings, momentum scores, and the opportunity each one unlocks.",
  alternates: { canonical: "/tools" },
};

const PRICING: Record<string, string> = {
  FREE: "Free", FREEMIUM: "Freemium", PAID: "Paid",
  SUBSCRIPTION: "Subscription", USAGE: "Usage-based", ENTERPRISE: "Enterprise",
};

export default async function ToolsIndex() {
  const tools = await safe(
    prisma.tool.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ momentumScore: "desc" }, { popularityScore: "desc" }],
      take: 100,
      select: {
        id: true, slug: true, name: true, tagline: true, vendor: true,
        categories: true, pricing: true, momentumScore: true, trendingScore: true,
        popularityScore: true, ranking: true,
      },
    }),
    [] as Awaited<ReturnType<typeof prisma.tool.findMany>>,
  );

  return (
    <div className="space-y-10">
      <PillarHero
        kicker="Pillar 3"
        title="Tools that actually matter."
        subtitle="Editorial picks, momentum scores, and what each tool unlocks for builders, creators, and operators."
        accent="tool"
      />

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-xl font-bold text-white">{tools.length} tracked</h2>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">By momentum</span>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t) => (
            <li key={t.id} className="card card-hover group p-5">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                {t.ranking && <span className="font-mono text-slate-500">#{String(t.ranking).padStart(2, "0")}</span>}
                <span className="ml-auto rounded bg-canvas-elevated px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {PRICING[t.pricing] ?? t.pricing}
                </span>
              </div>
              <Link href={`/tools/${t.slug}`}
                className="font-display text-base font-extrabold text-white group-hover:text-tool">
                {t.name}
              </Link>
              {t.vendor && <div className="text-[11px] text-slate-500">{t.vendor}</div>}
              <p className="mt-2 line-clamp-2 text-[13px] text-slate-400">{t.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.categories.slice(0, 3).map((c) => (
                  <span key={c} className="rounded bg-canvas-elevated px-1.5 py-0.5 text-[10px] text-slate-500">{c}</span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-1.5 text-[11px]">
                <S label="Mtm" v={t.momentumScore} c="text-tool" />
                <S label="Trend" v={t.trendingScore} c="text-warning" />
                <S label="Pop" v={t.popularityScore} c="text-signal" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function S({ label, v, c }: { label: string; v: number; c: string }) {
  return (
    <div className="rounded bg-canvas-elevated px-2 py-1">
      <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`font-semibold tabular-nums ${c}`}>{v.toFixed(0)}</div>
    </div>
  );
}
