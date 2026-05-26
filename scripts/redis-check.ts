// Quick Upstash/Redis connectivity check.
import { Redis } from "ioredis";
import { env } from "../src/lib/env";

async function main() {
  const r = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });
  try {
    await r.connect();
    const pong = await r.ping();
    await r.set("autonews:healthcheck", String(Date.now()));
    const val = await r.get("autonews:healthcheck");
    console.log(`PING -> ${pong}; read-back ok (${val ? "yes" : "no"})`);
  } finally {
    r.disconnect();
  }
}

main().catch((e) => {
  console.error("REDIS CHECK FAILED:", (e as Error).message);
  process.exit(1);
});
