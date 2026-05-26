import Link from "next/link";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { ReviewButtons, TriggerTrendButton } from "@/components/admin/AdminActions";

export const dynamic = "force-dynamic";

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

export default async function AdminDashboard() {
  if (!isAdmin()) return <LoginForm />;

  const [
    publishedCount,
    reviewQueue,
    draftCount,
    topics,
    sources,
    recentJobs,
    blogCount,
    subscribers,
    revenue,
    totalViews,
  ] = await Promise.all([
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.findMany({
      where: { status: "REVIEW" },
      orderBy: { qualityScore: "desc" },
      take: 20,
      include: { category: { select: { name: true } } },
    }),
    prisma.article.count({ where: { status: { in: ["DRAFT", "SCHEDULED"] } } }),
    prisma.trendTopic.findMany({ orderBy: { finalScore: "desc" }, take: 12 }),
    prisma.source.findMany({ orderBy: { name: "asc" } }),
    prisma.jobLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.article.count({ where: { status: "PUBLISHED", type: "BLOG" } }),
    prisma.newsletterSubscriber.count(),
    prisma.dailyStat.aggregate({ _sum: { adRevenueCents: true, affiliateCents: true } }),
    prisma.article.aggregate({ _sum: { views: true } }),
  ]);

  const revenueUsd = (
    ((revenue._sum.adRevenueCents ?? 0) + (revenue._sum.affiliateCents ?? 0)) / 100
  ).toFixed(2);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Control room</h1>
        <span className="text-xs rounded-full bg-slate-100 px-3 py-1">
          Mode: <strong>{env.PUBLISH_MODE}</strong> · min QA {env.MIN_QUALITY_SCORE}
        </span>
      </div>

      <TriggerTrendButton />

      <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Published" value={publishedCount} />
        <Stat label="In review" value={reviewQueue.length} />
        <Stat label="Pipeline" value={draftCount} sub="drafts + scheduled" />
        <Stat label="Blogs" value={blogCount} />
        <Stat label="Page views" value={totalViews._sum.views ?? 0} />
        <Stat label="Revenue" value={`$${revenueUsd}`} sub="ads + affiliate" />
      </section>

      {/* Review queue */}
      <section>
        <h2 className="text-lg font-bold mb-3">
          Review queue {env.PUBLISH_MODE === "auto" && "(auto mode — gate handled automatically)"}
        </h2>
        {reviewQueue.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing awaiting approval.</p>
        ) : (
          <div className="space-y-3">
            {reviewQueue.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded bg-slate-100 px-2 py-0.5">{a.type}</span>
                    {a.category && <span>{a.category.name}</span>}
                    <span>QA {Math.round(a.qualityScore)}</span>
                    <span>{a.wordCount} words</span>
                  </div>
                  <p className="font-semibold truncate">{a.title}</p>
                </div>
                <ReviewButtons id={a.id} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trending topics */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-bold mb-3">Trending topics</h2>
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
            {topics.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.title}</p>
                  <p className="text-xs text-slate-400">
                    viral {Math.round(t.viralScore)} · seo {Math.round(t.seoScore)} · fresh{" "}
                    {Math.round(t.freshnessScore)} · {t.sourceCount} sources
                    {t.isBreaking && " · 🔴 breaking"}
                  </p>
                </div>
                <span className="font-bold text-brand">{Math.round(t.finalScore)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Source monitoring */}
        <div>
          <h2 className="text-lg font-bold mb-3">Source monitoring</h2>
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
            {sources.map((s) => {
              const ok = s.lastStatus?.startsWith("ok");
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="text-xs text-slate-400">
                      {s.type} · {s.category}
                    </p>
                  </div>
                  <span className={`text-xs ${ok ? "text-green-600" : s.lastStatus ? "text-red-600" : "text-slate-400"}`}>
                    {s.lastStatus ?? "pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Job log */}
      <section>
        <h2 className="text-lg font-bold mb-3">Recent pipeline activity</h2>
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm font-mono">
          {recentJobs.map((j) => (
            <div key={j.id} className="flex items-center gap-3 p-2">
              <span className={j.status === "error" ? "text-red-600" : "text-green-600"}>
                {j.status === "error" ? "✗" : "✓"}
              </span>
              <span className="font-semibold">{j.job}</span>
              <span className="text-slate-400 truncate">{j.message}</span>
              <span className="ml-auto text-xs text-slate-400">
                {new Date(j.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-slate-500">
        Newsletter subscribers: <strong>{subscribers}</strong> ·{" "}
        <Link href="/" className="text-brand hover:underline">
          View live site
        </Link>
      </p>
    </div>
  );
}
