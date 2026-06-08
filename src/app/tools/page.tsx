import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { Sparkline } from "@/components/Sparkline";
import { AsciiRule } from "@/components/AsciiRule";

// Pillar 3 — Tools. Distinct template: TIER LIST (S / A / B / C) where every
// tool is placed by momentum score. Editorial tier breakdown — nobody else
// does this for AI tools and the layout is unlike any other pillar page.

export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Tools — tier list, ranked by momentum",
  description: "Tier-ranked AI tools (S/A/B/C) with editorial context, momentum scores, and category breakdown. Find what's growing fastest right now.",
  alternates: { canonical: "/tools" },
};

const PRICING: Record<string, string> = {
  FREE: "Free", FREEMIUM: "Freemium", PAID: "Paid",
  SUBSCRIPTION: "Subscription", USAGE: "Usage-based", ENTERPRISE: "Enterprise",
};

type Tier = "S" | "A" | "B" | "C";
function tierOf(score: number): Tier {
  if (score >= 88) return "S";
  if (score >= 78) return "A";
  if (score >= 65) return "B";
  return "C";
}
const TIER_META: Record<Tier, { label: string; sub: string; color: string }> = {
  S: { label: "S",  sub: "Must use", color: "text-brand" },
  A: { label: "A",  sub: "Strong",   color: "text-accent" },
  B: { label: "B",  sub: "Solid",    color: "text-tool" },
  C: { label: "C",  sub: "Niche",    color: "text-[color:rgb(var(--muted-fg))]" },
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

  // Bucket into tiers
  const tiers: Record<Tier, typeof tools> = { S: [], A: [], B: [], C: [] };
  for (const t of tools) tiers[tierOf(t.momentumScore)].push(t);

  // Categories
  const catCount: Record<string, number> = {};
  for (const t of tools) for (const c of t.categories) catCount[c] = (catCount[c] ?? 0) + 1;
  const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="space-y-14">
      {/* Distinct opener — tier-list dashboard */}
      <section className="relative -mx-5 -mt-10 border-b border-canvas-rule px-5 pb-12 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:pt-14">
        <div className="absolute inset-0 -z-10 grid-bg opacity-90" />
        <div className="mx-auto max-w-content">
          <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-tool">
            [ PILLAR · 03 / 06 · TIER · LIST ]
          </div>
          <h1 className="mt-4 font-display text-[2.6rem] font-normal italic leading-[1.02] text-[color:rgb(var(--fg))] md:text-[3.6rem]">
            The tools that matter.
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[color:rgb(var(--muted-fg))]">
            Every tool placed in S/A/B/C tiers by momentum, with sparklines showing the trajectory. Editorial context for each, never a passive directory.
          </p>

          {/* Tier counts strip */}
          <div className="mt-8 grid grid-cols-4 gap-3 md:max-w-2xl">
            {(["S", "A", "B", "C"] as Tier[]).map((t) => (
              <div key={t} className="card p-4 text-center">
                <div className={`font-display text-[3rem] italic leading-none tabular-nums tnum ${TIER_META[t].color}`}>{t}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">{TIER_META[t].sub}</div>
                <div className="mt-2 font-mono text-[11px] font-bold text-[color:rgb(var(--fg))]">{tiers[t].length} tools</div>
              </div>
            ))}
          </div>

          {topCats.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">BY CATEGORY</span>
              {topCats.map(([c, n]) => (
                <span key={c} className="rounded border border-canvas-rule bg-canvas-raised px-2 py-1 font-mono text-[10px] uppercase tracking-wider">
                  <span className="text-tool">{c}</span>
                  <span className="ml-1 text-[color:rgb(var(--muted-fg))]">{n}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* TIER SECTIONS */}
      {(["S", "A", "B", "C"] as Tier[]).map((t) => {
        if (tiers[t].length === 0) return null;
        return (
          <section key={t} className="mx-auto max-w-content">
            <div className="mb-4 flex items-end justify-between border-b border-canvas-rule pb-3">
              <div className="flex items-baseline gap-3">
                <span className={`font-display text-[3.4rem] italic leading-none ${TIER_META[t].color}`}>{t}</span>
                <div>
                  <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">[ TIER · {t} ]</div>
                  <h2 className="font-display text-[18px] italic text-[color:rgb(var(--fg))]">{TIER_META[t].sub} · {tiers[t].length} tool{tiers[t].length === 1 ? "" : "s"}</h2>
                </div>
              </div>
            </div>
            <div className="card divide-y divide-canvas-rule overflow-hidden">
              {tiers[t].map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.slug}`}
                  className="ledger-row group grid-cols-[44px_1fr_auto_100px_50px_30px]">
                  <span className="font-mono text-[12px] font-bold text-[color:rgb(var(--muted-fg))] tnum">
                    {tool.ranking ? `#${String(tool.ranking).padStart(2, "0")}` : "—"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-[18px] italic text-[color:rgb(var(--fg))] group-hover:text-brand">{tool.name}</span>
                      {tool.vendor && <span className="font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">{tool.vendor}</span>}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-[12px] text-[color:rgb(var(--muted-fg))]">{tool.tagline}</div>
                  </div>
                  <span className="rounded bg-canvas-elevated px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">
                    {PRICING[tool.pricing] ?? tool.pricing}
                  </span>
                  <span className="text-tool">
                    <Sparkline score={tool.momentumScore} seed={tool.slug} color="rgb(56 189 248)" />
                  </span>
                  <span className="text-right font-mono text-[14px] font-bold tabular-nums tnum text-tool">
                    {tool.momentumScore.toFixed(0)}
                  </span>
                  <span className="font-mono text-[10px] text-[color:rgb(var(--muted-fg))] group-hover:text-brand">→</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
