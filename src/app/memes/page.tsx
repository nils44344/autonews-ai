import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { categoryStyle, memeImageUrl } from "@/lib/ui";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Memes — the news, but funnier",
  description: "AI-generated, human-moderated memes about trending tech, AI, crypto and culture.",
};

export default async function MemesPage() {
  const memes = await safe(
    prisma.meme.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: 40,
      include: { category: { select: { name: true } } },
    }),
    [],
  );

  return (
    <div>
      <div className="mb-2 flex items-center gap-3">
        <h1 className="font-serif text-3xl font-bold text-ink dark:text-white">Memes</h1>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        The day&apos;s trends, served with a side of humour.
      </p>

      {memes.length === 0 ? (
        <p className="text-slate-500">No memes published yet — the next cycle will add some.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {memes.map((m) => {
            const c = categoryStyle(m.category?.name);
            return (
              <figure
                key={m.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Real classic-meme image (memegen.link) with the text baked in. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.imageUrl || memeImageUrl(m.format, m.topText, m.bottomText)}
                  alt={m.title}
                  loading="lazy"
                  className="aspect-square w-full bg-slate-100 object-contain dark:bg-slate-800"
                />
                <figcaption className="p-4">
                  {m.category && (
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c.badge}`}
                    >
                      {m.category.name}
                    </span>
                  )}
                  {m.caption && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{m.caption}</p>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </div>
  );
}
