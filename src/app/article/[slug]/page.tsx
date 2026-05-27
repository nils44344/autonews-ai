import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { renderMarkdown } from "@/lib/markdown";
import { categoryStyle } from "@/lib/ui";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, ldScript } from "@/lib/seo/schema";

export const revalidate = 300;

async function getArticle(slug: string) {
  return prisma.article.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      linksOut: { include: { to: { select: { slug: true, title: true, type: true } } } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const a = await getArticle(params.slug);
  if (!a) return { title: "Not found" };
  const url = `${env.SITE_URL}/article/${a.slug}`;
  return {
    title: a.seoTitle || a.title,
    description: a.seoDescription || a.excerpt || undefined,
    keywords: a.keywords,
    alternates: { canonical: a.canonicalUrl || url },
    openGraph: {
      type: "article",
      title: a.seoTitle || a.title,
      description: a.seoDescription || a.excerpt || undefined,
      url,
      publishedTime: a.publishedAt?.toISOString(),
      images: a.ogImage ? [a.ogImage] : undefined,
    },
    twitter: { card: "summary_large_image", title: a.seoTitle || a.title },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const a = await getArticle(params.slug);
  if (!a) notFound();

  // Fire-and-forget view counter.
  prisma.article.update({ where: { id: a.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const url = `${env.SITE_URL}/article/${a.slug}`;
  const faq = (a.faq as { question: string; answer: string }[] | null) ?? [];
  const sources = (a.sources as { title: string; url: string }[] | null) ?? [];
  const c = categoryStyle(a.category?.name);

  return (
    <article className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-800 md:p-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: ldScript(
            articleJsonLd({
              type: "NewsArticle",
              headline: a.title,
              description: a.seoDescription || a.excerpt || undefined,
              url,
              image: a.ogImage || undefined,
              datePublished: a.publishedAt?.toISOString(),
              dateModified: a.updatedAt.toISOString(),
              keywords: a.keywords,
            }),
            faqJsonLd(faq),
            breadcrumbJsonLd([
              { name: "Home", url: env.SITE_URL },
              {
                name: a.category?.name ?? "News",
                url: a.category
                  ? `${env.SITE_URL}/category/${a.category.slug}`
                  : `${env.SITE_URL}/`,
              },
              { name: a.title, url },
            ]),
          ),
        }}
      />

      <nav className="mb-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span>/</span>
        {a.category ? (
          <Link href={`/category/${a.category.slug}`} className="hover:text-brand">
            {a.category.name}
          </Link>
        ) : (
          <span className="text-slate-700 dark:text-slate-300">News</span>
        )}
      </nav>

      {a.category && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
          {a.category.name}
        </span>
      )}

      <h1 className="mt-3 break-words font-serif text-3xl font-extrabold leading-tight tracking-tight text-ink dark:text-white sm:text-4xl">
        {a.title}
      </h1>
      {a.dek && (
        <p className="mt-4 text-xl leading-relaxed text-slate-600 dark:text-slate-300">{a.dek}</p>
      )}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-200 pb-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{a.readingMin} min read</span>
        {a.publishedAt && (
          <span>
            ·{" "}
            {new Date(a.publishedAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Kolkata",
            })}
          </span>
        )}
        <span>· {a.wordCount.toLocaleString()} words</span>
      </div>

      {a.ogImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.ogImage}
          alt={a.title}
          fetchPriority="high"
          decoding="async"
          className="mt-6 aspect-video w-full rounded-2xl object-cover"
        />
      )}

      {a.excerpt && (
        <aside className="mt-6 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/5 to-fuchsia-500/5 p-5 dark:border-brand/30 dark:from-brand/10 dark:to-fuchsia-500/10">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand">
            ⚡ Quick read
          </p>
          <p className="text-base font-medium leading-relaxed text-slate-700 dark:text-slate-200">
            {a.excerpt}
          </p>
        </aside>
      )}

      <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} />

      {faq.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {faq.map((f, i) => (
              <details key={i} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <summary className="cursor-pointer font-semibold">{f.question}</summary>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {sources.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold mb-2">Sources</h2>
          <ul className="space-y-1 text-sm">
            {sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  rel="nofollow noopener"
                  target="_blank"
                  className="text-brand hover:underline"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {a.linksOut.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <h2 className="text-lg font-bold mb-3">Related</h2>
          <ul className="space-y-2">
            {a.linksOut.map((l) => (
              <li key={l.toId}>
                <Link
                  href={`${l.to.type === "BLOG" ? "/blog" : "/article"}/${l.to.slug}`}
                  className="text-brand hover:underline"
                >
                  {l.to.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
