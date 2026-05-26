import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { renderMarkdown } from "@/lib/markdown";
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

  return (
    <article className="mx-auto max-w-3xl">
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
              { name: a.category?.name ?? "News", url: `${env.SITE_URL}/` },
              { name: a.title, url },
            ]),
          ),
        }}
      />

      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/" className="hover:text-brand">Home</Link>
        {a.category && <span> / {a.category.name}</span>}
      </nav>

      <h1 className="text-4xl font-extrabold leading-tight">{a.title}</h1>
      {a.dek && <p className="mt-3 text-xl text-slate-600">{a.dek}</p>}
      <div className="mt-4 flex items-center gap-3 text-sm text-slate-500 border-b border-slate-200 pb-4">
        <span>{a.readingMin} min read</span>
        {a.publishedAt && <span>· {new Date(a.publishedAt).toLocaleDateString()}</span>}
        <span>· {a.wordCount} words</span>
      </div>

      <div
        className="prose mt-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }}
      />

      {faq.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {faq.map((f, i) => (
              <details key={i} className="rounded-lg border border-slate-200 p-4">
                <summary className="cursor-pointer font-semibold">{f.question}</summary>
                <p className="mt-2 text-slate-600">{f.answer}</p>
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
        <section className="mt-10 border-t border-slate-200 pt-6">
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
