// Repoint any article canonical URLs still pointing at localhost to the live
// SITE_URL (so Google indexes the public domain, not localhost).
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";

async function main() {
  const stale = await prisma.article.findMany({
    where: { canonicalUrl: { contains: "localhost" } },
    select: { id: true, slug: true, type: true },
  });
  for (const a of stale) {
    const path = a.type === "BLOG" ? "blog" : "article";
    await prisma.article.update({
      where: { id: a.id },
      data: { canonicalUrl: `${env.SITE_URL}/${path}/${a.slug}` },
    });
  }
  console.log(`updated ${stale.length} canonical URL(s) -> ${env.SITE_URL}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
