import { env } from "../src/lib/env";
import { prisma } from "../src/lib/db";
import { enqueue, publishQueue, trendQueue } from "../src/lib/queue/queues";

/**
 * Register repeatable jobs (BullMQ's built-in cron). Idempotent — repeatable
 * jobs are keyed, so re-registering on restart won't create duplicates.
 */
export async function registerSchedules() {
  // Trend detection on a fixed cadence.
  await trendQueue.add(
    "scheduled",
    { reason: "cron" },
    {
      repeat: { every: env.TREND_INTERVAL_MIN * 60_000 },
      jobId: "trend-cron",
      removeOnComplete: true,
    },
  );

  // Publish sweep: pick up scheduled articles whose time has arrived.
  await publishQueue.add(
    "sweep",
    { articleId: "__sweep__" },
    {
      repeat: { every: env.PUBLISH_INTERVAL_MIN * 60_000 },
      jobId: "publish-cron",
      removeOnComplete: true,
    },
  );

  console.log(
    `[scheduler] trend every ${env.TREND_INTERVAL_MIN}m, publish sweep every ${env.PUBLISH_INTERVAL_MIN}m`,
  );
}

/** Move due SCHEDULED articles into the publish queue. */
export async function runPublishSweep() {
  const due = await prisma.article.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
    select: { id: true },
    take: 50,
  });
  for (const a of due) await enqueue.publish({ articleId: a.id });
  return due.length;
}
