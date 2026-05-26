import Link from "next/link";

export interface CardArticle {
  slug: string;
  title: string;
  excerpt?: string | null;
  type: "NEWS" | "BLOG";
  readingMin: number;
  publishedAt?: Date | null;
  category?: { name: string } | null;
}

export function ArticleCard({ a }: { a: CardArticle }) {
  const href = `${a.type === "BLOG" ? "/blog" : "/article"}/${a.slug}`;
  return (
    <article className="group rounded-xl border border-slate-200 p-5 hover:border-brand hover:shadow-sm transition">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        {a.category && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium">
            {a.category.name}
          </span>
        )}
        <span>{a.readingMin} min read</span>
        {a.publishedAt && <span>· {new Date(a.publishedAt).toLocaleDateString()}</span>}
      </div>
      <h3 className="font-bold text-lg leading-snug group-hover:text-brand">
        <Link href={href}>{a.title}</Link>
      </h3>
      {a.excerpt && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{a.excerpt}</p>}
    </article>
  );
}
