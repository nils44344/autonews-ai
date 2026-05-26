import { Redis } from "ioredis";
import { env } from "../env";

// Shared Redis connection for BullMQ. maxRetriesPerRequest must be null for
// BullMQ blocking commands.
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const connection =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    // Don't open a socket until the first command. This keeps `next build` and
    // `docker build` (no Redis available) from throwing connection errors at
    // module-load time.
    lazyConnect: true,
  });

// Prevent unhandled 'error' events (e.g. Redis not reachable during build or a
// transient blip) from spamming stack traces; ioredis auto-reconnects.
connection.on("error", (err) => {
  if (process.env.NODE_ENV !== "production") return; // quiet in dev/build
  console.error("[redis]", err.message);
});

if (env.NODE_ENV !== "production") globalForRedis.redis = connection;
