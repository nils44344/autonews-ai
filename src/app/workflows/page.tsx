import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";

// Pillar 4 — Workflows. Practical, replicable systems. Retention engine.
export const revalidate = 600;

export const metadata: Metadata = {
  title: "AI Workflows — practical systems you can copy",
  description: "Curated AI workflows for creators, founders, marketers, and developers. Tools, steps, expected results.",
};

const KIND_LABEL: Record<string, string> = {
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
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 md:p-12">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300">
            Step-by-step
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
            AI Workflows you can copy today.
          </h1>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-300 md:text-lg">
            Each workflow stacks 2-5 tools into a repeatable system. Tools, steps, expected results, hours saved.
          </p>
        </div>
      </section>

      {items.length === 0 ? (
        <p className="text-center text-slate-500">No workflows yet.</p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {items.map((w) => (
            <li key={w.id}
              className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-violet-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-violet-700">
              <span className="mb-3 self-start rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                {KIND_LABEL[w.kind] ?? w.kind}
              </span>
              <Link href={`/workflows/${w.slug}`}
                className="font-display text-xl font-bold leading-snug text-slate-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                {w.title}
              </Link>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-400">{w.objective}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Saves <span className="font-bold text-emerald-600 dark:text-emerald-400">{w.timeSavedHours.toFixed(1)}h</span>
                </span>
                <span className="text-slate-500">
                  Difficulty <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">{w.difficultyScore.toFixed(0)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
