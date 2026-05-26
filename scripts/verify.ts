// One-shot end-to-end verification: collect trends → write ONE article with the
// local model → quality-check → publish. Proves the full chain works before
// scaling up to the full automated pipeline (trends:once / the worker).
import { appendFileSync } from "node:fs";
import { prisma } from "../src/lib/db";
import { runTrendCycle, selectTopTopics } from "../src/lib/trends/engine";
import { writeNewsArticle } from "../src/lib/content/news-writer";
import { assessArticle } from "../src/lib/quality";
import { approveAndPublish } from "../src/lib/publish";

const LOG = "scripts/verify.log";
const t0 = Date.now();
const log = (m: string) => {
  const line = `[${((Date.now() - t0) / 1000).toFixed(0)}s] ${m}`;
  console.log(line);
  try { appendFileSync(LOG, line + "\n"); } catch {}
};

async function main() {
  // Reuse topics already collected in a prior run (trend collection is slow);
  // only hit the network if the DB has nothing selectable yet.
  let [topic] = await selectTopTopics(1);
  if (!topic) {
    log("no existing topics — collecting trends from sources…");
    const cycle = await runTrendCycle();
    log(`got ${cycle.signals} signals → ${cycle.topics} ranked topics`);
    [topic] = await selectTopTopics(1);
  } else {
    log("reusing topics already in the database (skipping slow trend fetch)");
  }

  if (!topic) {
    log("no topics to write about (sources may be slow); try again shortly.");
    return;
  }
  log(`writing article for: "${topic.title}" (score ${Math.round(topic.finalScore)})`);

  const article = await writeNewsArticle(topic.id);
  log(`drafted "${article.title}" — ${article.wordCount} words`);

  const qa = await assessArticle(article.id);
  log(`quality score: ${qa.finalScore} (verdict: ${qa.verdict})`);

  // Force-publish this one so it appears on the site regardless of PUBLISH_MODE.
  const res = await approveAndPublish(article.id);
  log(res.published ? `PUBLISHED → /article/${res.article.slug}` : "publish skipped");

  const count = await prisma.article.count({ where: { status: "PUBLISHED" } });
  log(`total published articles: ${count}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
