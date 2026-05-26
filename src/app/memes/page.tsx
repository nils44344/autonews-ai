import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";

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
      <h1 className="text-3xl font-extrabold mb-1">Memes</h1>
      <p className="text-slate-600 mb-6">The day&apos;s trends, served with a side of humour.</p>

      {memes.length === 0 ? (
        <p className="text-slate-500">No memes published yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {memes.map((m) => (
            <figure key={m.id} className="rounded-xl border border-slate-200 overflow-hidden">
              {m.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.imageUrl} alt={m.title} className="w-full aspect-square object-cover" />
              ) : (
                <div className="aspect-square bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    {m.format}
                  </span>
                  {m.topText && <p className="mt-2 font-bold uppercase">{m.topText}</p>}
                  {m.bottomText && <p className="mt-auto font-bold uppercase">{m.bottomText}</p>}
                </div>
              )}
              <figcaption className="p-3 text-sm">
                {m.category && (
                  <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5">
                    {m.category.name}
                  </span>
                )}
                {m.caption && <p className="mt-2 text-slate-600">{m.caption}</p>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
