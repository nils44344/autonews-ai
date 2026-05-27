// Remove pre-pivot global test articles (published before the India pivot) and
// any leftover DRAFT/REJECTED junk, so the site only carries real India content.
import { prisma } from "../src/lib/db";

const CUTOFF = new Date("2026-05-26T14:00:00Z"); // India sources went live ~14:55 UTC

async function main() {
  const doomed = await prisma.article.findMany({
    where: {
      OR: [
        { status: "PUBLISHED", publishedAt: { lt: CUTOFF } },
        { status: { in: ["DRAFT", "REJECTED"] } },
      ],
    },
    select: { id: true, title: true, type: true, status: true },
  });

  console.log(`Deleting ${doomed.length} old/junk articles:`);
  for (const a of doomed) console.log(`  - [${a.status} ${a.type}] ${a.title.slice(0, 55)}`);

  const ids = doomed.map((a) => a.id);
  if (ids.length === 0) {
    console.log("nothing to delete.");
    return;
  }

  // Remove internal-link edges first (FK), then the articles.
  const links = await prisma.articleLink.deleteMany({
    where: { OR: [{ fromId: { in: ids } }, { toId: { in: ids } }] },
  });
  const del = await prisma.article.deleteMany({ where: { id: { in: ids } } });
  console.log(`removed ${links.count} internal links, deleted ${del.count} articles.`);

  const remain = await prisma.article.groupBy({ by: ["type"], where: { status: "PUBLISHED" }, _count: true });
  console.log("remaining PUBLISHED:", JSON.stringify(remain));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
