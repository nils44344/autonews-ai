import { createHmac, randomBytes } from "crypto";
import { prisma } from "../db";
import { env } from "../env";

// Post a tweet via X API v2. OAuth 1.0a user-context (the free-tier write
// auth). Fire-and-forget; safe if env vars are absent. Hard daily cap keeps us
// under the 500-posts/month free-tier limit even on heavy days.

const DAILY_CAP = 15; // ~450/month — safely under the 500/month free-tier write cap

function pe(s: string): string {
  return encodeURIComponent(s).replace(
    /[!*'()]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

function sign(method: string, url: string, params: Record<string, string>, cs: string, ts: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${pe(k)}=${pe(params[k])}`)
    .join("&");
  const base = `${method}&${pe(url)}&${pe(sorted)}`;
  const key = `${pe(cs)}&${pe(ts)}`;
  return createHmac("sha1", key).update(base).digest("base64");
}

export async function postToX(opts: { title: string; url: string }): Promise<{ ok: boolean; error?: string }> {
  const ck = env.X_API_KEY, cs = env.X_API_SECRET, tk = env.X_ACCESS_TOKEN, ts = env.X_ACCESS_SECRET;
  if (!ck || !cs || !tk || !ts) return { ok: false, error: "x not configured" };

  // Daily-cap guard — count successful posts in the last 24h.
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const used = await prisma.jobLog.count({
      where: { job: "x-post", status: "ok", createdAt: { gte: since } },
    });
    if (used >= DAILY_CAP) return { ok: false, error: `daily cap reached (${used}/${DAILY_CAP})` };
  } catch {
    /* if the count query fails, proceed — better to post than to block */
  }

  // Tweet: "Title\n\nlink". Truncate title if needed to fit ~280 chars.
  const linkLen = opts.url.length + 2; // newlines
  const maxTitle = 280 - linkLen - 4;
  const title = opts.title.length > maxTitle ? opts.title.slice(0, maxTitle - 1) + "…" : opts.title;
  const text = `${title}\n\n${opts.url}`;

  const endpoint = "https://api.twitter.com/2/tweets";
  const oauth: Record<string, string> = {
    oauth_consumer_key: ck,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: tk,
    oauth_version: "1.0",
  };
  oauth.oauth_signature = sign("POST", endpoint, oauth, cs, ts);
  const auth =
    "OAuth " +
    Object.keys(oauth)
      .sort()
      .map((k) => `${pe(k)}="${pe(oauth[k])}"`)
      .join(", ");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      await prisma.jobLog.create({ data: { job: "x-post", status: "ok", message: title.slice(0, 120) } }).catch(() => {});
      return { ok: true };
    }
    const err = `${res.status}: ${(await res.text()).slice(0, 180)}`;
    await prisma.jobLog.create({ data: { job: "x-post", status: "error", message: err } }).catch(() => {});
    return { ok: false, error: err };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
