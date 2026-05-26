import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterForm } from "@/components/NewsletterForm";

export const revalidate = 120; // ISR: refresh the homepage every 2 minutes

export default async function HomePage() {
  const [latest, trending] = await Promise.all([
    safe(
      prisma.article.findMany({
        where: { status: "PUBLISHED", type: "NEWS" },
        orderBy: { publishedAt: "desc" },
        take: 9,
        include: { category: { select: { name: true } } },
      }),
      [],
    ),
    safe(
      prisma.trendTopic.findMany({
        where: { status: { in: ["RANKED", "SELECTED", "GENERATED", "PUBLISHED"] } },
        orderBy: { finalScore: "desc" },
        take: 8,
      }),
      [],
    ),
  ]);

  const [lead, ...rest] = latest;

  return (
    <div className="space-y-10">
      {lead ? (
        <section className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">
              Top story
            </span>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight">
              <Link href={`/article/${lead.slug}`} className="hover:text-brand">
                {lead.title}
              </Link>
            </h1>
            {lead.dek && <p className="mt-3 text-lg text-slate-600">{lead.dek}</p>}
            <p className="mt-3 text-sm text-slate-500">{lead.readingMin} min read</p>
          </div>
          <aside className="rounded-xl border border-slate-200 p-5">
            <h2 className="font-bold text-sm uppercase tracking-wide text-slate-500">
              Trending now
            </h2>
            <ol className="mt-3 space-y-2 text-sm">
              {trending.map((t, i) => (
                <li key={t.id} className="flex gap-2">
                  <span className="font-bold text-brand">{i + 1}</span>
                  <span className="text-slate-700">
                    {t.title}
                    <span className="ml-1 text-xs text-slate-400">
                      ({Math.round(t.finalScore)})
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </section>
      ) : (
        <EmptyState />
      )}

      {rest.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Latest news</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-slate-50 p-6">
        <h2 className="text-lg font-bold">Get the daily briefing</h2>
        <p className="mt-1 mb-4 text-sm text-slate-600">
          The top stories, summarised by AI and reviewed by editors. No spam.
        </p>
        <NewsletterForm />
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
      <h1 className="text-2xl font-bold">No published articles yet</h1>
      <p className="mt-2 text-slate-600">
        Start the worker and trigger a trend cycle from the{" "}
        <Link href="/admin" className="text-brand underline">
          admin dashboard
        </Link>{" "}
        to generate your first stories.
      </p>
    </section>
  );
}
