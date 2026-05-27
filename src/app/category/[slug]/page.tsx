import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { safe } from "@/lib/safe";
import { categoryStyle } from "@/lib/ui";
import { ArticleCard } from "@/components/ArticleCard";

export const revalidate = 120;

async function getCategory(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const cat = await getCategory(params.slug);
  if (!cat) return { title: "Not found" };
  return {
    title: `${cat.name} News`,
    description: `Latest ${cat.name} news, updates and analysis from India.`,
    alternates: { canonical: `${env.SITE_URL}/category/${params.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = await getCategory(params.slug);
  if (!cat) notFound();
  const c = categoryStyle(cat.name);

  const articles = await safe(
    prisma.article.findMany({
      where: { status: "PUBLISHED", category: { slug: params.slug } },
      orderBy: { publishedAt: "desc" },
      take: 30,
      include: { category: { select: { name: true } } },
    }),
    [],
  );

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className={`h-9 w-1.5 rounded-full bg-gradient-to-b ${c.gradient}`} />
        <h1 className="font-serif text-3xl font-bold text-ink dark:text-white">{cat.name}</h1>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>

      {articles.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">
          No {cat.name} stories yet — the next cycle will add some.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}
