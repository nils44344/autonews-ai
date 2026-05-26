import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { categoryStyle } from "@/lib/ui";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterForm } from "@/components/NewsletterForm";

export const revalidate = 120; // ISR: refresh the homepage every 2 minutes

export default async function HomePage() {
  const [latest, trending] = await Promise.all([
    safe(
      prisma.article.findMany({
        where: { status: "PUBLISHED", type: "NEWS" },
        orderBy: { publishedAt: "desc" },
        take: 10,
        include: { category: { select: { name: true } } },
      }),
      [],
    ),
    safe(
      prisma.trendTopic.findMany({
        where: { status: { in: ["RANKED", "SELECTED", "GENERATED", "PUBLISHED"] } },
        orderBy: { finalScore: "desc" },
        take: 6,
      }),
      [],
    ),
  ]);

  const [lead, ...rest] = latest;
  const leadStyle = categoryStyle(lead?.category?.name);

  if (!lead) return <EmptyState />;

  return (
    <div className="space-y-12">
      {/* Hero: featured story + trending rail */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Link
          href={`/article/${lead.slug}`}
          className="group relative col-span-2 flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${leadStyle.gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative p-8 text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              ★ Top Story
              {lead.category && <span className="opacity-80">· {lead.category.name}</span>}
            </span>
            <h1 className="mt-4 font-serif text-3xl font-extrabold leading-tight drop-shadow-sm md:text-4xl">
              {lead.title}
            </h1>
            {lead.dek && (
              <p className="mt-3 max-w-2xl text-base text-white/85 md:text-lg">{lead.dek}</p>
            )}
            <p className="mt-4 text-sm font-medium text-white/70">
              {lead.readingMin} min read
              {lead.publishedAt &&
                ` · ${new Date(lead.publishedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}`}
            </p>
          </div>
        </Link>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink">
            <span className="h-4 w-1 rounded-full bg-brand" />
            Trending now
          </h2>
          <ol className="mt-4 space-y-4">
            {trending.map((t, i) => (
              <li key={t.id} className="flex gap-3">
                <span className="font-serif text-2xl font-black leading-none text-slate-200">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium leading-snug text-slate-700">{t.title}</span>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {/* Latest grid */}
      {rest.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold text-ink">Latest News</h2>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-slate-800 p-8 text-white md:p-10">
        <div className="max-w-xl">
          <h2 className="font-serif text-2xl font-bold">Get the daily briefing</h2>
          <p className="mt-2 text-slate-300">
            The day&apos;s top stories, summarised by AI and delivered to your inbox. No spam,
            unsubscribe anytime.
          </p>
          <div className="mt-5">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">No published articles yet</h1>
      <p className="mx-auto mt-2 max-w-md text-slate-600">
        The next automated cycle will publish stories here shortly. You can also trigger one from
        the{" "}
        <Link href="/admin" className="font-medium text-brand underline">
          admin dashboard
        </Link>
        .
      </p>
    </section>
  );
}
