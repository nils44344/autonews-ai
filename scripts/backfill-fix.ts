// One-off repair of already-published articles:
//   • strip a leftover "Hook"/"Lead" label the old prompt left at the top
//   • re-fetch a topic-relevant, varied image (replaces duplicates/missing)
//   npx tsx scripts/backfill-fix.ts
import { prisma } from "../src/lib/db";
import { fetchArticleImage } from "../src/lib/images";

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
    take: 150,
    select: { id: true, title: true, body: true, keywords: true, category: { select: { name: true } } },
  });

  let bodies = 0;
  let images = 0;
  for (const a of arts) {
    try {
      const data: { body?: string; ogImage?: string; imageCredit?: string } = {};
      const cleaned = stripLeadingLabel(a.body);
      if (cleaned !== a.body) data.body = cleaned;

      const img = await fetchArticleImage(a.category?.name ?? "", a.keywords);
      if (img) {
        data.ogImage = img.url;
        data.imageCredit = img.credit;
      }

      if (Object.keys(data).length) {
        await prisma.article.update({ where: { id: a.id }, data });
        if (data.body) bodies++;
        if (data.ogImage) images++;
      }
    } catch (e) {
      console.error(`  ✗ ${a.title.slice(0, 44)}:`, (e as Error).message.slice(0, 70));
    }
  }

  console.log(`done. cleaned ${bodies} bodies, re-imaged ${images} of ${arts.length} articles.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
