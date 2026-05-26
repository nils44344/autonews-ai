import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { renderMarkdown } from "@/lib/markdown";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd, ldScript } from "@/lib/seo/schema";

export const revalidate = 600;

async function getPost(slug: string) {
  return prisma.article.findFirst({
    where: { slug, status: "PUBLISHED", type: "BLOG" },
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
  const a = await getPost(params.slug);
  if (!a) return { title: "Not found" };
  const url = `${env.SITE_URL}/blog/${a.slug}`;
  return {
    title: a.seoTitle || a.title,
    description: a.seoDescription || a.excerpt || undefined,
    keywords: a.keywords,
    alternates: { canonical: a.canonicalUrl || url },
    openGraph: { type: "article", title: a.title, url },
  };
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const a = await getPost(params.slug);
  if (!a) notFound();

  const url = `${env.SITE_URL}/blog/${a.slug}`;
  const faq = (a.faq as { question: string; answer: string }[] | null) ?? [];

  return (
    <article className="mx-auto max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: ldScript(
            articleJsonLd({
              type: "BlogPosting",
              headline: a.title,
              description: a.seoDescription || a.excerpt || undefined,
              url,
              datePublished: a.publishedAt?.toISOString(),
              dateModified: a.updatedAt.toISOString(),
              keywords: a.keywords,
            }),
            faqJsonLd(faq),
            breadcrumbJsonLd([
              { name: "Home", url: env.SITE_URL },
              { name: "Blog", url: `${env.SITE_URL}/blog` },
              { name: a.title, url },
            ]),
          ),
        }}
      />
      <nav className="text-xs text-slate-500 mb-3">
        <Link href="/blog" className="hover:text-brand">Blog</Link>
      </nav>
      <h1 className="text-4xl font-extrabold leading-tight">{a.title}</h1>
      {a.dek && <p className="mt-3 text-xl text-slate-600">{a.dek}</p>}
      <p className="mt-4 text-sm text-slate-500 border-b border-slate-200 pb-4">
        {a.readingMin} min read {a.publishedAt && `· ${new Date(a.publishedAt).toLocaleDateString()}`}
      </p>
      <div className="prose mt-6" dangerouslySetInnerHTML={{ __html: renderMarkdown(a.body) }} />

      {a.linksOut.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-bold mb-3">Read next</h2>
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
