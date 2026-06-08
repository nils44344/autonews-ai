import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safe } from "@/lib/safe";
import { AsciiRule } from "@/components/AsciiRule";

// Pillar 6 — News. Distinct template: front-page lead story + 2 secondaries,
// then a CATEGORY BAR with counts, then a byline-formatted feed by category.
export const revalidate = 180;

export const metadata: Metadata = {
  title: "AI & Tech News — high-signal updates",
  description: "AI, startups, markets, and tech news filtered for what actually moves opportunity. Front-page lead, secondaries, and category breakdown.",
  alternates: { canonical: "/news" },
};

type LatestRow = {
  id: string; slug: string; title: string; dek: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
};

export default async function NewsHub() {
  const latest = await safe<LatestRow[]>(
    prisma.article.findMany({
      where: { status: "PUBLISHED", type: "NEWS" },
      orderBy: { publishedAt: "desc" },
      take: 60,
      select: {
        id: true, slug: true, title: true, dek: true, publishedAt: true,
        category: { select: { name: true, slug: true } },
      },
    }) as Promise<LatestRow[]>,
    [],
  );

  const [lead, second, third, ...rest] = latest;

  // Category breakdown
  const byCat: Record<string, LatestRow[]> = {};
  for (const a of [...(third ? [] : []), ...rest]) {
    const c = a.category?.name ?? "Uncategorised";
    if (!byCat[c]) byCat[c] = [];
    byCat[c].push(a);
  }
  const catList = Object.entries(byCat).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="space-y-14">
      {/* Front-page lead — distinct from every other pillar */}
      <section className="relative -mx-5 -mt-10 border-b border-canvas-rule px-5 pb-12 pt-10 sm:-mx-6 sm:px-6 md:-mt-14 md:pt-14">
        <div className="absolute inset-0 -z-10 grid-bg opacity-90" />
        <div className="mx-auto max-w-content">
          <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">
            [ PILLAR · 06 / 06 · FRONT PAGE ]
          </div>
          {lead ? (
            <Link href={`/article/${lead.slug}`} className="group mt-4 block">
              {lead.category?.name && (
                <div className="font-mono text-[10px] uppercase tracking-bracket text-brand">[{lead.category.name}]</div>
              )}
              <h1 className="mt-2 font-display text-[2.6rem] font-normal italic leading-[1.02] text-[color:rgb(var(--fg))] group-hover:text-brand md:text-[3.6rem]">
                {lead.title}
              </h1>
              {lead.dek && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[color:rgb(var(--muted-fg))]">{lead.dek}</p>}
              {lead.publishedAt && (
                <time className="mt-3 block font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">
                  {new Date(lead.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </time>
              )}
            </Link>
          ) : (
            <h1 className="mt-4 font-display text-[2.6rem] italic">News.</h1>
          )}

          {(second || third) && (
            <div className="mt-10 grid gap-6 border-t border-canvas-rule pt-6 md:grid-cols-2">
              {[second, third].filter(Boolean).map((a) => (
                <Link key={a!.id} href={`/article/${a!.slug}`} className="group block">
                  {a!.category?.name && (
                    <div className="font-mono text-[10px] uppercase tracking-bracket text-brand">[{a!.category.name}]</div>
                  )}
                  <h2 className="mt-1 font-display text-[20px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand line-clamp-2">
                    {a!.title}
                  </h2>
                  {a!.dek && <p className="mt-2 line-clamp-2 text-[13px] text-[color:rgb(var(--muted-fg))]">{a!.dek}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <AsciiRule className="mx-auto max-w-content opacity-30" />

      {/* Category bar */}
      {catList.length > 0 && (
        <section className="mx-auto max-w-content">
          <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">[ BY CATEGORY ]</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {catList.map(([name, arr]) => (
              <Link key={name} href={`/category/${arr[0].category?.slug ?? ""}`}
                className="rounded border border-canvas-rule bg-canvas-raised px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider hover:border-brand/40">
                <span className="text-[color:rgb(var(--fg))]">{name}</span>
                <span className="ml-1.5 text-[color:rgb(var(--muted-fg))]">{arr.length}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Feed grouped by category — byline format */}
      {catList.map(([name, arr]) => (
        <section key={name} className="mx-auto max-w-content">
          <div className="mb-4 flex items-end justify-between border-b border-canvas-rule pb-3">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-bracket text-brand">[ {name} ]</div>
              <h2 className="mt-1 font-display text-[20px] italic text-[color:rgb(var(--fg))]">{arr.length} stor{arr.length === 1 ? "y" : "ies"}</h2>
            </div>
            {arr[0].category?.slug && (
              <Link href={`/category/${arr[0].category.slug}`} className="font-mono text-[11px] font-bold uppercase tracking-bracket text-[color:rgb(var(--muted-fg))] hover:text-brand">
                All →
              </Link>
            )}
          </div>
          <ul className="divide-y divide-canvas-rule">
            {arr.slice(0, 8).map((a) => (
              <li key={a.id} className="py-3">
                <Link href={`/article/${a.slug}`} className="group flex items-baseline gap-4">
                  {a.publishedAt && (
                    <span className="w-20 shrink-0 font-mono text-[10px] uppercase tracking-bracket text-[color:rgb(var(--muted-fg))]">
                      {new Date(a.publishedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <span className="font-display text-[16px] italic leading-snug text-[color:rgb(var(--fg))] group-hover:text-brand">{a.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
