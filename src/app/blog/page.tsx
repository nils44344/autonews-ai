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
      <h1 className="text-3xl font-extrabold mb-1">Blog</h1>
      <p className="text-slate-600 mb-6">Explainers, guides, comparisons and analysis.</p>
      {posts.length === 0 ? (
        <p className="text-slate-500">No blog posts yet.</p>
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
