import type { Job } from "bullmq";
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { runTrendCycle, selectTopTopics } from "../src/lib/trends/engine";
import { writeNewsArticle } from "../src/lib/content/news-writer";
import { generateBlogCluster } from "../src/lib/content/blog-generator";
import { generateMeme } from "../src/lib/content/meme-generator";
import { assessArticle } from "../src/lib/quality";
import { publishArticle } from "../src/lib/publish";
import { enqueue } from "../src/lib/queue/queues";
import type {
  ArticleJob,
  BlogJob,
  MemeJob,
  PublishJob,
  QualityJob,
  TrendJob,
} from "../src/lib/queue/queues";

// 1) Trend cycle → select top topics → fan out article jobs + meme jobs.
export async function processTrend(_job: Job<TrendJob>) {
  const result = await runTrendCycle();
  const topics = await selectTopTopics(env.TOPICS_PER_CYCLE);
  for (const t of topics) {
    await prisma.trendTopic.update({ where: { id: t.id }, data: { status: "SELECTED" } });
    await enqueue.article({ topicId: t.id });
    await enqueue.meme({ topicId: t.id }); // meme job self-skips if not meme-worthy
  }
  return { ...result, selected: topics.length };
}

// 2) Write the news article, then queue quality assessment.
export async function processArticle(job: Job<ArticleJob>) {
  const article = await writeNewsArticle(job.data.topicId);
  await enqueue.quality({ articleId: article.id });
  return { articleId: article.id };
}

// 3) Assess quality. On pass, queue publish; for NEWS pillars, spin the blog cluster.
export async function processQuality(job: Job<QualityJob>) {
  const report = await assessArticle(job.data.articleId);
  const article = await prisma.article.findUniqueOrThrow({ where: { id: job.data.articleId } });

  if (report.finalScore >= env.MIN_QUALITY_SCORE) {
    await enqueue.publish({ articleId: article.id });
    if (article.type === "NEWS" && article.isPillar) {
      await enqueue.blog({ pillarArticleId: article.id });
    }
  } else {
    await prisma.article.update({ where: { id: article.id }, data: { status: "REJECTED" } });
  }
  return { score: report.finalScore, verdict: report.verdict };
}

// 4) Generate the supporting blog cluster, then assess each post.
export async function processBlog(job: Job<BlogJob>) {
  const posts = await generateBlogCluster(job.data.pillarArticleId);
  for (const p of posts) await enqueue.quality({ articleId: p.id });
  return { posts: posts.length };
}

// 5) Generate a meme (self-skips non-meme-worthy / unsafe topics).
export async function processMeme(job: Job<MemeJob>) {
  const meme = await generateMeme(job.data.topicId);
  return { memeId: meme?.id ?? null };
}

// 6) Publish (or route to manual review depending on PUBLISH_MODE).
export async function processPublish(job: Job<PublishJob>) {
  return publishArticle(job.data.articleId);
}
