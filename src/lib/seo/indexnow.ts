import { env } from "../env";

/**
 * Push freshly-published URLs to IndexNow so they're indexed within minutes,
 * not days. IndexNow notifies Bing, Yandex, Seznam, Naver (and Google is
 * evaluating it) — free, no account. Google itself still relies on the sitemap +
 * Search Console (it retired its ping endpoint), so the sitemap covers Google.
 * Fire-and-forget: an indexing ping must never break publishing.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  if (!env.INDEXNOW_KEY || urls.length === 0) return;
  try {
    const host = new URL(env.SITE_URL).host;
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: env.INDEXNOW_KEY,
        keyLocation: `${env.SITE_URL}/${env.INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    await prismaSafeLog(res.status, urls.length);
  } catch {
    /* ignore */
  }
}

// Best-effort job log (kept out of the hot path; ignore any failure).
async function prismaSafeLog(status: number, count: number): Promise<void> {
  try {
    const { prisma } = await import("../db");
    await prisma.jobLog.create({
      data: { job: "indexnow", status: status < 400 ? "ok" : "error", message: `${status} · ${count} url(s)` },
    });
  } catch {
    /* ignore */
  }
}
