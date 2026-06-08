import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { AsciiRule } from "@/components/AsciiRule";

// Pillar 4 — Workflows. Distinct template: TIME-SAVED LEADERBOARD at the top
// (the metric that matters most for builders), then kind-grouped sections.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Workflows — systems to copy",
  description: "Curated AI workflows ranked by hours saved. Tools, steps, expected results for creators, founders, marketers, and developers.",
  alternates: { canonical: "/workflows" },
};

const KIND_LABEL: Record<string, string> = {
  CREATOR: "Creator", BUSINESS: "Business", AUTOMATION: "Automation",
  DEVELOPER: "Developer", MARKETING: "Marketing", TRADING: "Trading", RESEARCH: "Research",
};

export default async function WorkflowsIndex() {
  const items = await safe(
    prisma.workflow.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ timeSavedHours: "desc" }, { popularityScore: "desc" }],
      take: 60,
      select: {
        id: true, slug: true, title: true, kind: true, objective: true,
        timeSavedHours: true, difficultyScore: true, popularityScore: true,
      },
    }),
    [] as Awaited<ReturnType<typeof prisma.workflow.findMany>>,
  );

  const totalSaved = items.reduce((a, w) => a + w.timeSavedHours, 0);
  const top3 = items.slice(0, 3);
  // Group remainder by kind
  const byKind: Record<string, typeof items> = {};
  for (const w of items.slice(3)) {
    if (!byKind[w.kind]) byKind[w.kind] = [];
    byKind[w.kind].push(w);
  }
  const kindOrder = Object.keys(byKind).sort((a, b) => byKind[b].length - byKind[a].length);

  return (
    <div className="space-y-14">
      {/* Time-saved leaderboard opener */}
      <section className="relative -mx-5 -mt-10 border-b border-canvas-rule px-5 pb-12 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:pt-14">
        <div className="absolute inset-0 -z-10 grid-bg opacity-90" />
        <div className="mx-auto max-w-content">
          <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-workflow">
            [ PILLAR · 04 / 06 · LEADERBOARD ]
          </div>
          <h1 className="mt-4 font-display text-[2.6rem] font-normal italic leading-[1.02] text-[color:rgb(var(--fg))] md:text-[3.6rem]">
            Workflows, ranked by hours saved.
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[color:rgb(var(--muted-fg))]">
            Each workflow stacks 2-5 tools into a repeatable system. Sorted by what actually moves a builder&apos;s output — time back in the day.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total" value={totalSaved.toFixed(0) + "h"} sub="across all workflows" accent="text-growth" />
            <Stat label="Workflows" value={items.length.toString()} sub="published" />
            <Stat label="Kinds" value={Object.keys(byKind).length.toString()} sub="categories" />
            <Stat label="Avg" value={(items.length ? totalSaved / items.length : 0).toFixed(1) + "h"} sub="per workflow" accent="text-accent" />
          </div>

          {/* Top 3 leaderboard rows */}
          {top3.length > 0 && (
            <div className="mt-8 space-y-2">
              <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">[ TOP 3 · BIGGEST WINS ]</div>
              {top3.map((w, i) => (
                <Link key={w.id} href={`/workflows/${w.slug}`}
                  className="card card-hover group flex items-center gap-4 p-4">
                  <span className="font-display text-[2.6rem] italic leading-none text-workflow tnum">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-bracket text-workflow">[{w.kind}]</div>
                    <div className="mt-1 font-display text-[18px] italic text-[color:rgb(var(--fg))] group-hover:text-brand line-clamp-1">{w.title}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-[2rem] italic leading-none text-growth tnum">+{w.timeSavedHours.toFixed(1)}h</div>
                    <div className="font-mono text-[9px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">time saved</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* Kind-grouped sections */}
      {kindOrder.map((k) => (
        <section key={k} className="mx-auto max-w-content">
          <div className="mb-4 flex items-end justify-between border-b border-canvas-rule pb-3">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-workflow">[ {KIND_LABEL[k] ?? k} ]</div>
              <h2 className="mt-1 font-display text-[20px] italic text-[color:rgb(var(--fg))]">{byKind[k].length} workflow{byKind[k].length === 1 ? "" : "s"}</h2>
            </div>
          </div>
          <ul className="grid gap-5 md:grid-cols-2">
            {byKind[k].map((w) => (
              <li key={w.id} className="card card-hover group p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-workflow/15 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-bracket text-workflow">
                    [{KIND_LABEL[w.kind] ?? w.kind}]
                  </span>
                  <span className="font-display text-[1.4rem] italic leading-none text-growth tnum">+{w.timeSavedHours.toFixed(1)}h</span>
                </div>
                <Link href={`/workflows/${w.slug}`}
                  className="mt-3 block font-display text-[18px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand">
                  {w.title}
                </Link>
                <p className="mt-2 line-clamp-2 text-[13px] text-[color:rgb(var(--muted-fg))]">{w.objective}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Stat({ label, value, sub, accent = "text-[color:rgb(var(--fg))]" }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="card p-4">
      <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">[{label}]</div>
      <div className={`mt-1 font-display text-[2rem] italic leading-none tabular-nums tnum ${accent}`}>{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[color:rgb(var(--muted-fg))]">{sub}</div>
    </div>
  );
}
