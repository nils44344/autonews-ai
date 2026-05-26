import { Queue } from "bullmq";
import { connection } from "./connection";

// Job payload contracts (one per queue).
export interface TrendJob { reason?: string }
export interface ArticleJob { topicId: string }
export interface BlogJob { pillarArticleId: string }
export interface MemeJob { topicId: string }
export interface QualityJob { articleId: string }
export interface PublishJob { articleId: string }

export const QUEUE = {
  trend: "trend-cycle",
  article: "generate-article",
  blog: "generate-blog",
  meme: "generate-meme",
  quality: "assess-quality",
  publish: "publish",
} as const;

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: { count: 500 },
  removeOnFail: { count: 1000 },
};

export const trendQueue = new Queue<TrendJob>(QUEUE.trend, { connection, defaultJobOptions });
export const articleQueue = new Queue<ArticleJob>(QUEUE.article, { connection, defaultJobOptions });
export const blogQueue = new Queue<BlogJob>(QUEUE.blog, { connection, defaultJobOptions });
export const memeQueue = new Queue<MemeJob>(QUEUE.meme, { connection, defaultJobOptions });
export const qualityQueue = new Queue<QualityJob>(QUEUE.quality, { connection, defaultJobOptions });
export const publishQueue = new Queue<PublishJob>(QUEUE.publish, { connection, defaultJobOptions });

/**
 * Convenience enqueue helpers used by the API and the scheduler.
 *
 * NOTE: custom jobIds use "-" as the separator, NOT ":". BullMQ v5 rejects a
 * custom job id containing ":" ("Custom Id cannot contain :") because ":" is the
 * Redis key separator. These keyed ids also deduplicate work (e.g. the same
 * topic won't be enqueued twice).
 */
export const enqueue = {
  trend: (data: TrendJob = {}) => trendQueue.add("run", data),
  article: (data: ArticleJob) => articleQueue.add("write", data, { jobId: `article-${data.topicId}` }),
  blog: (data: BlogJob) => blogQueue.add("cluster", data, { jobId: `blog-${data.pillarArticleId}` }),
  meme: (data: MemeJob) => memeQueue.add("meme", data, { jobId: `meme-${data.topicId}` }),
  quality: (data: QualityJob) => qualityQueue.add("assess", data, { jobId: `qa-${data.articleId}` }),
  publish: (data: PublishJob, delayMs = 0) =>
    publishQueue.add("publish", data, { delay: delayMs, jobId: `pub-${data.articleId}` }),
};
