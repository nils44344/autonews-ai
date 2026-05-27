import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { categoryStyle } from "@/lib/ui";
import { ArticleCard } from "@/components/ArticleCard";
import { NewsletterForm } from "@/components/NewsletterForm";

export const revalidate = 120; // ISR: refresh the homepage every 2 minutes

export default async function HomePage() {
  const [latest, popular] = await Promise.all([
    safe(
      prisma.article.findMany({
        where: { status: "PUBLISHED", type: "NEWS" },
        orderBy: { publishedAt: "desc" },
        take: 10,
        include: { category: { select: { name: true } } },
      }),
      [],
    ),
    // Most-read articles from the LAST 7 DAYS only — keeps "Trending" fresh so
    // older posts that slowly accrue views can't dominate forever.
    safe(
      prisma.article.findMany({
        where: {
          status: "PUBLISHED",
          publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
        take: 7,
        select: { id: true, slug: true, title: true, type: true },
      }),
      [],
    ),
  ]);

  const [lead, ...rest] = latest;
  const leadStyle = categoryStyle(lead?.category?.name);
  const trending = popular.filter((p) => p.id !== lead?.id).slice(0, 6);

  if (!lead) return <EmptyState />;

  return (
    <div className="space-y-10">
      {/* Live trending ticker (auto-scrolling marquee) */}
      {trending.length > 0 && (
        <div className="-mx-4 flex items-center overflow-hidden border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 sm:mx-0 sm:rounded-2xl sm:border">
          <span className="z-10 flex shrink-0 items-center gap-1.5 self-stretch bg-accent px-3 text-xs font-extrabold uppercase tracking-wide text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Trending
          </span>
          <div className="overflow-hidden py-2.5">
            <div className="flex w-max animate-marquee gap-10 pl-10">
              {[...trending, ...trending].map((t, i) => (
                <Link
                  key={i}
                  href={`${t.type === "BLOG" ? "/blog" : "/article"}/${t.slug}`}
                  className="whitespace-nowrap text-sm font-medium text-slate-600 transition hover:text-brand dark:text-slate-300"
                >
                  <span className="font-bold text-accent">›</span> {t.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero: featured story + trending rail */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Link
          href={`/article/${lead.slug}`}
          className="group relative col-span-2 flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl shadow-sm ring-1 ring-black/5"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${leadStyle.gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative p-6 text-white sm:p-8">
            <span className="inline-flex flex-wrap items-center gap-x-2 rounded-full bg-white/15 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide backdrop-blur sm:text-xs">
              ★ Top Story
              {lead.category && <span className="opacity-80">· {lead.category.name}</span>}
            </span>
            <h1 className="mt-4 break-words font-serif text-[1.6rem] font-extrabold leading-tight drop-shadow-sm sm:text-3xl md:text-4xl">
              {lead.title}
            </h1>
            {lead.dek && (
              <p className="mt-3 max-w-2xl text-base text-white/85 md:text-lg">{lead.dek}</p>
            )}
            <p className="mt-4 text-sm font-medium text-white/70">
              {lead.readingMin} min read
              {lead.publishedAt &&
                ` · ${new Date(lead.publishedAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  timeZone: "Asia/Kolkata",
                })}`}
            </p>
          </div>
        </Link>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink dark:text-white">
            <span className="h-4 w-1 rounded-full bg-brand" />
            Trending now
          </h2>
          <ol className="mt-3 space-y-1">
            {trending.map((t, i) => (
              <li key={t.id}>
                <Link
                  href={`${t.type === "BLOG" ? "/blog" : "/article"}/${t.slug}`}
                  className="group -mx-2 flex gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="font-serif text-2xl font-black leading-none text-slate-200 transition group-hover:text-brand/40 dark:text-slate-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm font-medium leading-snug text-slate-700 transition group-hover:text-brand dark:text-slate-300">
                    {t.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </section>

      {/* Latest grid */}
      {rest.length > 0 && (
        <section>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold text-ink dark:text-white">Latest News</h2>
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
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
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
      <h1 className="font-serif text-2xl font-bold text-ink dark:text-white">No published articles yet</h1>
      <p className="mx-auto mt-2 max-w-md text-slate-600 dark:text-slate-400">
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
