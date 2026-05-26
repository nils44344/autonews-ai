import Link from "next/link";
import { categoryStyle } from "@/lib/ui";

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
  const c = categoryStyle(a.category?.name);
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${c.ring}`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${c.gradient}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-2 text-xs">
          {a.category && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${c.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
              {a.category.name}
            </span>
          )}
          <span className="text-slate-400">{a.readingMin} min read</span>
        </div>

        <h3 className="font-serif text-lg font-bold leading-snug text-ink transition group-hover:text-brand">
          <Link href={href} className="hover:underline">
            {a.title}
          </Link>
        </h3>

        {a.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{a.excerpt}</p>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400">
          {a.publishedAt && (
            <span>
              {new Date(a.publishedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <span className="ml-auto font-semibold text-brand opacity-0 transition group-hover:opacity-100">
            Read →
          </span>
        </div>
      </div>
    </article>
  );
}
