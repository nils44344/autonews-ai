import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { categoryStyle } from "@/lib/ui";

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
                {m.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.imageUrl} alt={m.title} className="aspect-square w-full object-cover" />
                ) : (
                  <div
                    className={`flex aspect-square flex-col items-center justify-between gap-2 bg-gradient-to-br ${c.gradient} p-5 text-center`}
                  >
                    <p className="break-words text-sm font-black uppercase leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.45)] sm:text-base">
                      {m.topText}
                    </p>
                    <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-white/70">
                      {m.format}
                    </span>
                    <p className="break-words text-sm font-black uppercase leading-tight text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.45)] sm:text-base">
                      {m.bottomText}
                    </p>
                  </div>
                )}
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
