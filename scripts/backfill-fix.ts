// One-off repair of already-published articles:
//   • strip a leftover "Hook"/"Lead" label the old prompt left at the top
//   • give every article a UNIQUE, relevant HD image (no repeats across posts)
//   npx tsx scripts/backfill-fix.ts
import { prisma } from "../src/lib/db";
import { fetchImagePool, type ArticleImage } from "../src/lib/images";

// Remove a leading line that is just the section label (e.g. "Hook", "## Lead").
export function stripLeadingLabel(body: string): string {
  const lines = body.split("\n");
  while (
    lines.length &&
    /^\s*(#{1,6}\s*|\*\*\s*)?(hook|lead)\s*(\*\*)?\s*:?\s*$/i.test(lines[0])
  ) {
    lines.shift();
  }
  while (lines.length && lines[0].trim() === "") lines.shift();
  return lines.join("\n");
}

async function main() {
  const arts = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, body: true, category: { select: { name: true } } },
  });

  // Group by category so each gets a big-enough pool of distinct images.
  const byCat = new Map<string, typeof arts>();
  for (const a of arts) {
    const c = a.category?.name ?? "news";
    (byCat.get(c) ?? byCat.set(c, []).get(c)!).push(a);
  }

  const usedGlobal = new Set<string>(); // ensures NO image repeats across ANY post
  let images = 0;
  let bodies = 0;

  for (const [cat, list] of byCat) {
    const pool = await fetchImagePool(cat, list.length + 25);
    let cursor = 0;
    const nextUnique = (): ArticleImage | null => {
      while (cursor < pool.length && usedGlobal.has(pool[cursor].url)) cursor++;
      return cursor < pool.length ? pool[cursor++] : null;
    };

    for (const a of list) {
      try {
        const data: { body?: string; ogImage?: string; imageCredit?: string } = {};
        const cleaned = stripLeadingLabel(a.body);
        if (cleaned !== a.body) data.body = cleaned;

        const img = nextUnique();
        if (img) {
          usedGlobal.add(img.url);
          data.ogImage = img.url;
          data.imageCredit = img.credit;
        }
        if (Object.keys(data).length) {
          await prisma.article.update({ where: { id: a.id }, data });
          if (data.ogImage) images++;
          if (data.body) bodies++;
        }
      } catch (e) {
        console.error(`  ✗ ${a.title.slice(0, 40)}:`, (e as Error).message.slice(0, 60));
      }
    }
    console.log(`  ${cat}: ${list.length} articles, pool ${pool.length}`);
  }

  console.log(`\ndone. ${images} unique images assigned, ${bodies} bodies cleaned. total distinct: ${usedGlobal.size}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
