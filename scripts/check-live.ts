import { prisma } from "../src/lib/db";

async function main() {
  const byType = await prisma.article.groupBy({
    by: ["type"],
    where: { status: "PUBLISHED" },
    _count: true,
  });
  console.log("PUBLISHED by type:", JSON.stringify(byType));

  console.log("--- latest NEWS (publishedAt desc) ---");
  const news = await prisma.article.findMany({
    where: { status: "PUBLISHED", type: "NEWS" },
    orderBy: { publishedAt: "desc" },
    take: 8,
    select: { title: true, publishedAt: true, views: true, category: { select: { name: true } } },
  });
  for (const a of news) {
    const when = a.publishedAt ? new Date(a.publishedAt).toISOString().slice(5, 16) : "?";
    console.log(`  ${when} [${a.category?.name ?? "?"}] v${a.views} - ${a.title.slice(0, 48)}`);
  }

  console.log("--- TRENDING (views desc) ---");
  const trend = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: 6,
    select: { title: true, views: true, type: true },
  });
  for (const a of trend) console.log(`  v${a.views} ${a.type} - ${a.title.slice(0, 48)}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
