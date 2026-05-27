// Repair already-published articles:
//   • re-categorise from the title (fix source-driven mislabels, e.g. a GST
//     story stuck in "Technology")
//   • give every article a topic-relevant, UNIQUE HD image (no repeats anywhere)
//   • strip any leftover "Hook"/"Lead" label
//   npx tsx scripts/backfill-fix.ts
import { prisma } from "../src/lib/db";
import { fetchImagePool, imageQueryFor, type ArticleImage } from "../src/lib/images";
import { classifyCategory } from "../src/lib/content/classify";

export function stripLeadingLabel(body: string): string {
  const lines = body.split("\n");
  while (lines.length && /^\s*(#{1,6}\s*|\*\*\s*)?(hook|lead)\s*(\*\*)?\s*:?\s*$/i.test(lines[0]))
    lines.shift();
  while (lines.length && lines[0].trim() === "") lines.shift();
  return lines.join("\n");
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  const arts = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { id: true, title: true, body: true, type: true, category: { select: { name: true, slug: true } } },
  });

  // 1) Decide each article's correct category + image query.
  type Plan = { id: string; body: string; name: string; slug: string; query: string };
  const plans: Plan[] = arts.map((a) => {
    const isBlog = a.type === "BLOG";
    const cur = a.category;
    // Blogs keep their existing section; news re-classified from the title.
    const cls = isBlog ? null : classifyCategory(a.title);
    const name = cls?.name ?? cur?.name ?? "News";
    const slug = cls?.slug ?? cur?.slug ?? slugify(name);
    return { id: a.id, body: a.body, name, slug, query: imageQueryFor(name, a.title) };
  });

  // 2) Ensure all needed categories exist → slug→id map.
  const catId = new Map<string, string>();
  for (const slug of new Set(plans.map((p) => p.slug))) {
    const p = plans.find((x) => x.slug === slug)!;
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name: p.name, slug, kind: "news" },
    });
    catId.set(slug, cat.id);
  }

  // 3) Per image-query, build a pool; assign globally-unique images.
  const poolCache = new Map<string, ArticleImage[]>();
  const cursor = new Map<string, number>();
  const usedGlobal = new Set<string>();
  let images = 0;
  let recats = 0;

  for (const p of plans) {
    try {
      let pool = poolCache.get(p.query);
      if (!pool) {
        const need = plans.filter((x) => x.query === p.query).length + 15;
        pool = await fetchImagePool(p.query, need);
        poolCache.set(p.query, pool);
        cursor.set(p.query, 0);
      }
      let i = cursor.get(p.query)!;
      while (i < pool.length && usedGlobal.has(pool[i].url)) i++;
      const img = i < pool.length ? pool[i++] : null;
      cursor.set(p.query, i);

      const data: { categoryId: string; ogImage?: string; imageCredit?: string; body?: string } = {
        categoryId: catId.get(p.slug)!,
      };
      if (img) {
        usedGlobal.add(img.url);
        data.ogImage = img.url;
        data.imageCredit = img.credit;
        images++;
      }
      const cleaned = stripLeadingLabel(p.body);
      if (cleaned !== p.body) data.body = cleaned;

      const before = arts.find((a) => a.id === p.id)!;
      if (before.category?.slug !== p.slug) recats++;

      await prisma.article.update({ where: { id: p.id }, data });
    } catch (e) {
      console.error(`  ✗ ${p.id}:`, (e as Error).message.slice(0, 60));
    }
  }

  console.log(
    `done. ${images} unique images, ${recats} re-categorised, ${usedGlobal.size} distinct images, ${poolCache.size} queries.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
