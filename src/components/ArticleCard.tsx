import Link from "next/link";
import { categoryStyle } from "@/lib/ui";

export interface CardArticle {
  slug: string;
  title: string;
  excerpt?: string | null;
  type: "NEWS" | "BLOG";
  readingMin: number;
  publishedAt?: Date | null;
  ogImage?: string | null;
  category?: { name: string } | null;
}

export function ArticleCard({ a }: { a: CardArticle }) {
  const href = `${a.type === "BLOG" ? "/blog" : "/article"}/${a.slug}`;
  const c = categoryStyle(a.category?.name);
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 ${c.ring}`}
    >
      <div className="block overflow-hidden">
        {a.ogImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.ogImage}
            alt={a.title}
            loading="lazy"
            decoding="async"
            className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className={`aspect-video w-full bg-gradient-to-br ${c.gradient}`} />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2 text-xs">
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

        <h3 className="break-words font-serif text-lg font-bold leading-snug text-ink transition group-hover:text-brand dark:text-white">
          {/* Stretched link — makes the ENTIRE card clickable (image, text, Read →) */}
          <Link href={href} className="after:absolute after:inset-0 hover:underline">
            {a.title}
          </Link>
        </h3>

        {a.excerpt && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {a.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-400 dark:border-slate-800">
          {a.publishedAt && (
            <span>
              {new Date(a.publishedAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                timeZone: "Asia/Kolkata",
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
