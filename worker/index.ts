import { Worker, type Job } from "bullmq";
import { connection } from "../src/lib/queue/connection";
import { QUEUE } from "../src/lib/queue/queues";
import { prisma } from "../src/lib/db";
import {
  processArticle,
  processBlog,
  processMeme,
  processPublish,
  processQuality,
  processTrend,
} from "./processors";
import { registerSchedules, runPublishSweep } from "./scheduler";

// Wrap each processor with structured job logging.
function logged<T>(name: string, fn: (job: Job<T>) => Promise<unknown>) {
  return async (job: Job<T>) => {
    const t0 = Date.now();
    try {
      const out = await fn(job);
      await prisma.jobLog.create({
        data: { job: name, status: "ok", message: `${Date.now() - t0}ms`, meta: out as object },
      });
      return out;
    } catch (err) {
      await prisma.jobLog.create({
        data: { job: name, status: "error", message: (err as Error).message?.slice(0, 500) },
      });
      throw err;
    }
  };
}

// Concurrency is 1 for every LLM-bound queue: a CPU-only Ollama host can only
// hold one model in memory at a time, so parallel generation OOMs ("unable to
// allocate CPU buffer"). The Ollama client also enforces this with a mutex, but
// keeping concurrency low avoids buffering many in-flight jobs in memory too.
const workers = [
  new Worker(QUEUE.trend, logged("trend", processTrend), { connection, concurrency: 1 }),
  new Worker(QUEUE.article, logged("article", processArticle), { connection, concurrency: 1 }),
  new Worker(QUEUE.blog, logged("blog", processBlog), { connection, concurrency: 1 }),
  new Worker(QUEUE.meme, logged("meme", processMeme), { connection, concurrency: 1 }),
  new Worker(QUEUE.quality, logged("quality", processQuality), { connection, concurrency: 1 }),
  new Worker(
    QUEUE.publish,
    logged("publish", async (job: Job<{ articleId: string }>) => {
      if (job.data.articleId === "__sweep__") return { swept: await runPublishSweep() };
      return processPublish(job);
    }),
    { connection, concurrency: 3 },
  ),
];

for (const w of workers) {
  w.on("failed", (job, err) =>
    console.error(`[worker:${w.name}] job ${job?.id} failed:`, err.message),
  );
  w.on("completed", (job) => console.log(`[worker:${w.name}] job ${job.id} ✓`));
}

// (Top-level await isn't available when tsx runs this as CommonJS.)
registerSchedules()
  .then(() => console.log(`[worker] online — ${workers.length} queues processing`))
  .catch((err) => {
    console.error("[worker] failed to register schedules:", err);
    process.exit(1);
  });

async function shutdown() {
  console.log("\n[worker] shutting down…");
  await Promise.all(workers.map((w) => w.close()));
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
