// Show published-article count + the most recent few (title, slug, score).
import { prisma } from "../src/lib/db";

async function main() {
  const count = await prisma.article.count({ where: { status: "PUBLISHED" } });
  const latest = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 5,
    select: { title: true, slug: true, wordCount: true, qualityScore: true, type: true },
  });
  console.log(`PUBLISHED articles: ${count}`);
  for (const a of latest) {
    console.log(`- [${a.type} q${a.qualityScore} ${a.wordCount}w] ${a.title}\n    /article/${a.slug}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
