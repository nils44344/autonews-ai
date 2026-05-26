// Email a digest of the last 24h of published news to all subscribers.
// Run via `npm run digest` (scheduled daily). Skips gracefully if there are no
// new articles or no subscribers. Respects Resend's free-tier rate (100/day).
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { sendEmail } from "../src/lib/email";

const LOOKBACK_HOURS = 24;

interface DigestArticle {
  title: string;
  dek: string | null;
  slug: string;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function renderDigest(articles: DigestArticle[], unsubToken: string): string {
  const items = articles
    .map(
      (a) => `
    <tr><td style="padding:14px 0;border-bottom:1px solid #eef2f7;">
      <a href="${env.SITE_URL}/article/${a.slug}" style="font-size:18px;font-weight:700;color:#0b1120;text-decoration:none;font-family:Georgia,serif;">${escapeHtml(a.title)}</a>
      ${a.dek ? `<p style="margin:6px 0 0;color:#475569;font-size:14px;line-height:1.5;">${escapeHtml(a.dek)}</p>` : ""}
    </td></tr>`,
    )
    .join("");
  const unsub = `${env.SITE_URL}/api/newsletter/unsubscribe?token=${unsubToken}`;
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;padding:28px;">
          <tr><td style="border-bottom:2px solid #4f46e5;padding-bottom:12px;">
            <span style="font-family:Georgia,serif;font-size:22px;font-weight:800;color:#0b1120;">${escapeHtml(env.SITE_NAME)}</span>
            <span style="color:#64748b;font-size:13px;"> · your briefing</span>
          </td></tr>
          ${items}
          <tr><td style="padding-top:22px;color:#94a3b8;font-size:12px;line-height:1.6;">
            You subscribed at <a href="${env.SITE_URL}" style="color:#94a3b8;">${escapeHtml(env.SITE_URL)}</a>.
            <a href="${unsub}" style="color:#94a3b8;">Unsubscribe</a>.
          </td></tr>
        </table>
      </td></tr>
    </table></body></html>`;
}

async function main() {
  if (!env.RESEND_API_KEY) {
    console.log("RESEND_API_KEY not set — skipping digest.");
    return;
  }

  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600_000);
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", type: "NEWS", publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: 10,
    select: { title: true, dek: true, slug: true },
  });
  if (articles.length === 0) {
    console.log(`no articles published in the last ${LOOKBACK_HOURS}h — nothing to send.`);
    return;
  }

  const subs = await prisma.newsletterSubscriber.findMany({
    select: { email: true, unsubToken: true },
  });
  if (subs.length === 0) {
    console.log("no subscribers yet — nothing to send.");
    return;
  }

  console.log(`sending digest of ${articles.length} article(s) to ${subs.length} subscriber(s)…`);
  let sent = 0;
  let failed = 0;
  for (const sub of subs) {
    const res = await sendEmail({
      to: sub.email,
      subject: `${env.SITE_NAME}: ${articles.length} new ${articles.length === 1 ? "story" : "stories"}`,
      html: renderDigest(articles, sub.unsubToken),
    });
    if (res.ok) {
      sent++;
    } else {
      failed++;
      console.error(`  ✗ ${sub.email}: ${res.error}`);
    }
    await new Promise((r) => setTimeout(r, 700)); // stay under Resend's rate limit
  }
  console.log(`done. sent=${sent} failed=${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
