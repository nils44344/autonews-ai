/**
 * Run a DB query but tolerate the database being unreachable — used by pages
 * that are statically pre-rendered at build time, where no database exists
 * (e.g. `docker build`). At runtime the DB is always present; this only changes
 * the build-time prerender to an empty shell that ISR fills in on first request.
 */
export async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}
