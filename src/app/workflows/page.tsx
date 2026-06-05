import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { PillarHero } from "@/components/PillarHero";

// Pillar 4 — Workflows. Indigo accent.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Workflows — practical systems you can copy",
  description: "Curated AI workflows for creators, founders, marketers, and developers. Tools, steps, expected results.",
};

const KIND: Record<string, string> = {
  CREATOR: "Creator", BUSINESS: "Business", AUTOMATION: "Automation",
  DEVELOPER: "Developer", MARKETING: "Marketing", TRADING: "Trading", RESEARCH: "Research",
};

export default async function WorkflowsIndex() {
  const items = await safe(
    prisma.workflow.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ popularityScore: "desc" }, { publishedAt: "desc" }],
      take: 60,
      select: {
        id: true, slug: true, title: true, kind: true, objective: true,
        timeSavedHours: true, difficultyScore: true, popularityScore: true,
      },
    }),
    [] as Awaited<ReturnType<typeof prisma.workflow.findMany>>,
  );

  return (
    <div className="space-y-10">
      <PillarHero
        kicker="Pillar 4 · Step-by-step"
        title="Workflows you can copy today."
        subtitle="Each workflow stacks 2–5 tools into a repeatable system. Tools, steps, expected results, hours saved."
        accent="workflow"
      />

      <ul className="grid gap-5 md:grid-cols-2">
        {items.map((w) => (
          <li key={w.id} className="card card-hover group p-6">
            <span className="mb-3 inline-block rounded-full bg-workflow/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-workflow">
              {KIND[w.kind] ?? w.kind}
            </span>
            <Link href={`/workflows/${w.slug}`}
              className="block font-display text-lg font-bold leading-snug text-white group-hover:text-workflow">
              {w.title}
            </Link>
            <p className="mt-2 line-clamp-3 text-[13px] text-slate-400">{w.objective}</p>
            <div className="mt-4 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">
                Saves <span className="font-bold text-growth">{w.timeSavedHours.toFixed(1)}h</span>
              </span>
              <span className="text-slate-500">
                Difficulty <span className="font-semibold tabular-nums text-slate-300">{w.difficultyScore.toFixed(0)}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
