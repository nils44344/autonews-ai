// Recover stranded DRAFT articles: re-assess each (blog-cluster posts were never
// assessed; some news QA failed under Groq rate-limits) and publish those that
// clear the quality bar. Skips empty/failed generations. Spaced out to be gentle
// on Groq's rate limit.
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { assessArticle } from "../src/lib/quality";
import { publishArticle } from "../src/lib/publish";

async function main() {
  const drafts = await prisma.article.findMany({
    where: { status: "DRAFT" },
    select: { id: true, title: true, type: true, body: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`found ${drafts.length} DRAFT article(s)`);

  let published = 0;
  let low = 0;
  let skipped = 0;
  let failed = 0;

  for (const d of drafts) {
    if (!d.body || d.body.length < 400) {
      skipped++;
      console.log(`  skip (empty/failed gen): ${d.title}`);
      continue;
    }
    try {
      const qa = await assessArticle(d.id);
      if (qa.finalScore >= env.MIN_QUALITY_SCORE) {
        await publishArticle(d.id);
        published++;
        console.log(`  ✓ ${d.type} "${d.title}" (QA ${qa.finalScore})`);
      } else {
        low++;
        console.log(`  – ${d.type} "${d.title}" below bar (QA ${qa.finalScore})`);
      }
    } catch (e) {
      failed++;
      console.error(`  ✗ "${d.title}":`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`done. published=${published} low=${low} skipped=${skipped} failed=${failed}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
