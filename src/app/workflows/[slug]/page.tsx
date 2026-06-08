import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const revalidate = 600;

interface Tool { name: string; url?: string; role: string }
interface Step { title: string; detail: string }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const w = await prisma.workflow.findUnique({
    where: { slug },
    select: { title: true, objective: true, seoTitle: true, seoDescription: true, status: true, ogImage: true },
  });
  if (!w || w.status !== "PUBLISHED") return { title: "Workflow not found" };
  const title = w.title.length <= 55 ? w.title : w.title.slice(0, 55) + "…";
  return {
    title,
    description: w.seoDescription ?? w.objective.slice(0, 160),
    alternates: { canonical: `${env.SITE_URL}/workflows/${slug}` },
    openGraph: {
      type: "article",
      images: w.ogImage ? [w.ogImage] : [`${env.SITE_URL}/opengraph-image`],
    },
  };
}

export default async function WorkflowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const w = await prisma.workflow.findUnique({ where: { slug } });
  if (!w || w.status !== "PUBLISHED") notFound();

  prisma.workflow.update({ where: { id: w.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const tools = Array.isArray(w.toolsRequired) ? (w.toolsRequired as unknown as Tool[]) : [];
  const steps = Array.isArray(w.steps) ? (w.steps as unknown as Step[]) : [];

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <Link href="/workflows" className="text-xs font-semibold uppercase tracking-wider text-violet-600 hover:underline dark:text-violet-400">
          ← All Workflows
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
          {w.title}
        </h1>
        <p className="max-w-3xl text-lg text-slate-700 dark:text-slate-300">{w.objective}</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Time saved" value={`${w.timeSavedHours.toFixed(1)}h`} color="emerald" />
        <Stat label="Difficulty" value={`${w.difficultyScore.toFixed(0)}/100`} color="amber" />
        <Stat label="Popularity" value={`${w.popularityScore.toFixed(0)}/100`} color="violet" />
      </section>

      {tools.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-slate-900 dark:text-white">Tools required</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tools.map((t, i) => (
              <li key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                {t.url ? (
                  <a href={t.url} target="_blank" rel="noopener nofollow" className="font-semibold text-violet-700 hover:underline dark:text-violet-400">
                    {t.name} ↗
                  </a>
                ) : (
                  <span className="font-semibold text-slate-900 dark:text-white">{t.name}</span>
                )}
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.role}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-bold text-slate-900 dark:text-white">Steps</h2>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {w.expectedResults && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <h2 className="mb-2 font-display text-lg font-bold text-emerald-700 dark:text-emerald-300">
            Expected results
          </h2>
          <p className="text-emerald-900 dark:text-emerald-100">{w.expectedResults}</p>
        </section>
      )}
    </article>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: "emerald" | "amber" | "violet" }) {
  const txt = { emerald: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", violet: "text-violet-600 dark:text-violet-400" }[color];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 font-display text-2xl font-extrabold tabular-nums ${txt}`}>{value}</div>
    </div>
  );
}
