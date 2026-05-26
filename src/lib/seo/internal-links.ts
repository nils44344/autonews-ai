import { prisma } from "../db";

/**
 * Build internal links for an article by matching shared keywords / cluster
 * membership against other published articles, then persisting ArticleLink rows.
 * This powers the on-page "related articles" block and spreads link equity.
 */
export async function buildInternalLinks(articleId: string, max = 5) {
  const article = await prisma.article.findUniqueOrThrow({ where: { id: articleId } });

  const candidates = await prisma.article.findMany({
    where: {
      id: { not: article.id },
      status: { in: ["PUBLISHED", "SCHEDULED"] },
      OR: [
        { clusterId: article.clusterId ?? undefined },
        { keywords: { hasSome: article.keywords } },
        { categoryId: article.categoryId ?? undefined },
      ],
    },
    select: { id: true, title: true, keywords: true, clusterId: true },
    take: 50,
  });

  // Rank by keyword overlap + same-cluster boost.
  const scored = candidates
    .map((c) => {
      const overlap = c.keywords.filter((k) => article.keywords.includes(k)).length;
      const clusterBoost = c.clusterId && c.clusterId === article.clusterId ? 3 : 0;
      return { c, score: overlap + clusterBoost };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max);

  if (scored.length === 0) return [];

  await prisma.articleLink.createMany({
    data: scored.map((s) => ({ fromId: article.id, toId: s.c.id, anchor: s.c.title })),
    skipDuplicates: true,
  });

  return scored.map((s) => s.c);
}

/** Auto-insert affiliate links where their keywords appear in the body. */
export async function injectAffiliateLinks(body: string): Promise<string> {
  const links = await prisma.affiliateLink.findMany({ where: { enabled: true } });
  let out = body;
  const used = new Set<string>();
  for (const link of links) {
    for (const kw of link.keywords) {
      if (used.has(link.id)) break;
      // Only link the first occurrence, and skip text already inside a link.
      const re = new RegExp(`(?<!\\[)\\b(${escapeRe(kw)})\\b(?!\\])`, "i");
      if (re.test(out)) {
        out = out.replace(re, `[$1](${link.url})`);
        used.add(link.id);
      }
    }
  }
  return out;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
