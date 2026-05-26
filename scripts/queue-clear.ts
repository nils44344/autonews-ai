// Wipe all BullMQ queues (jobs + repeatable schedulers). Safe to run while the
// worker is stopped; the worker re-creates its repeatable schedules on restart.
import {
  trendQueue,
  articleQueue,
  blogQueue,
  memeQueue,
  qualityQueue,
  publishQueue,
} from "../src/lib/queue/queues";
import { connection } from "../src/lib/queue/connection";

async function main() {
  const queues = [trendQueue, articleQueue, blogQueue, memeQueue, qualityQueue, publishQueue];
  for (const q of queues) {
    await q.obliterate({ force: true });
    console.log(`cleared queue: ${q.name}`);
  }
}

main()
  .catch((e) => {
    console.error("clear failed:", (e as Error).message);
    process.exit(1);
  })
  .finally(() => connection.disconnect());
