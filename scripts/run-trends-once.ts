// Run one full pipeline pass synchronously (no Redis/worker needed).
// Handy for local testing:  npm run trends:once
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { runTrendCycle, selectTopTopics } from "../src/lib/trends/engine";
import { writeNewsArticle } from "../src/lib/content/news-writer";
import { generateBlogCluster } from "../src/lib/content/blog-generator";
import { generateMeme } from "../src/lib/content/meme-generator";
import { assessArticle } from "../src/lib/quality";
import { publishArticle } from "../src/lib/publish";

async function main() {
  console.log("→ collecting trends…");
  const { topics, signals } = await runTrendCycle();
  console.log(`  ${signals} signals → ${topics} topics`);

  const selected = await selectTopTopics(env.TOPICS_PER_CYCLE);
  console.log(`→ generating ${selected.length} articles…`);

  for (const topic of selected) {
    try {
      const article = await writeNewsArticle(topic.id);
      const qa = await assessArticle(article.id);
      console.log(`  ✓ "${article.title}" (QA ${qa.finalScore})`);

      if (qa.finalScore >= env.MIN_QUALITY_SCORE) {
        await publishArticle(article.id);
        await generateBlogCluster(article.id);
      }
      await generateMeme(topic.id);
    } catch (e) {
      console.error(`  ✗ ${topic.title}:`, (e as Error).message);
    }
  }
  console.log("done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
