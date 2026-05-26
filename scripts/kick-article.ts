// Fast worker-path test: enqueue ONE article job (+meme) for an existing topic,
// skipping the slow trend-collection step. Exercises the exact enqueue path that
// hit the "Custom Id cannot contain :" bug, then the worker writes/QAs/publishes.
import { selectTopTopics } from "../src/lib/trends/engine";
import { enqueue } from "../src/lib/queue/queues";
import { prisma } from "../src/lib/db";
import { connection } from "../src/lib/queue/connection";

async function main() {
  const [topic] = await selectTopTopics(1);
  if (!topic) {
    console.log("no selectable topic found");
    return;
  }
  await prisma.trendTopic.update({ where: { id: topic.id }, data: { status: "SELECTED" } });
  const a = await enqueue.article({ topicId: topic.id });
  const m = await enqueue.meme({ topicId: topic.id });
  console.log(`enqueued article=${a.id} meme=${m.id} for "${topic.title}"`);
}

main()
  .catch((e) => {
    console.error("kick-article failed:", (e as Error).message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    connection.disconnect();
  });
