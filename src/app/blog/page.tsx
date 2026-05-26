import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { ArticleCard } from "@/components/ArticleCard";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Blog — explainers, guides & analysis",
  description: "In-depth explainers, comparisons, predictions and how-to guides.",
};

export default async function BlogIndex() {
  const posts = await safe(
    prisma.article.findMany({
      where: { status: "PUBLISHED", type: "BLOG" },
      orderBy: { publishedAt: "desc" },
      take: 30,
      include: { category: { select: { name: true } } },
    }),
    [],
  );

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <h1 className="font-serif text-3xl font-bold text-ink dark:text-white">Blog</h1>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        Explainers, guides, comparisons and analysis.
      </p>
      {posts.length === 0 ? (
        <p className="text-slate-500">No blog posts yet — the next cycle will add some.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}
