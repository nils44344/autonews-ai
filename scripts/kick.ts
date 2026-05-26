// Enqueue a single trend-cycle job right now (so we don't wait for the cron).
// The running worker picks it up and fans out article/meme jobs.
import { enqueue } from "../src/lib/queue/queues";
import { connection } from "../src/lib/queue/connection";

async function main() {
  const job = await enqueue.trend({ reason: "manual-kick" });
  console.log(`enqueued trend job id=${job.id}`);
}

main()
  .catch((e) => {
    console.error("kick failed:", (e as Error).message);
    process.exit(1);
  })
  .finally(() => connection.disconnect());
