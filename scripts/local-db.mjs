// Self-contained local PostgreSQL for development — no system install needed.
// Starts a persistent Postgres on localhost:5432 (user/pass: autonews/autonews,
// database: autonews) using bundled binaries, then stays running.
//
//   node scripts/local-db.mjs
//
// Data lives in ./.localdb and survives restarts. Stop with Ctrl+C.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = join(root, ".localdb");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "autonews",
  password: "autonews",
  port: 5432,
  persistent: true,
});

// initdb only on first run (PG_VERSION marks an initialised cluster).
if (!existsSync(join(databaseDir, "PG_VERSION"))) {
  console.log("[local-db] initialising data directory…");
  await pg.initialise();
}

await pg.start();
console.log("[local-db] PostgreSQL started on localhost:5432");

try {
  await pg.createDatabase("autonews");
  console.log("[local-db] created database 'autonews'");
} catch {
  console.log("[local-db] database 'autonews' already exists");
}

console.log("[local-db] READY — leave this window open. Ctrl+C to stop.");

async function shutdown() {
  console.log("\n[local-db] stopping…");
  try {
    await pg.stop();
  } catch {}
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
