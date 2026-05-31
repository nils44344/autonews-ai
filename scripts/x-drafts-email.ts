// Email a digest of human-style X (Twitter) drafts for today's news, so the
// owner can copy-paste them into their X account manually. Built because X
// killed the free posting tier (402 CreditsDepleted). Generates one draft per
// article using the cheap 8b model, in a tone tuned to dodge AI-detector tells
// (no em-dashes, no "delve/comprehensive/moreover", varied openers, sometimes
// lowercase, sometimes a question, sometimes a flat fact).
import { generate } from "../src/lib/ai";
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { sendEmail } from "../src/lib/email";

const LOOKBACK_HOURS = 24;
const MAX_ARTICLES = 12; // ~one per X cycle if posted every 2h

const SYSTEM = `You write tweets the way a real person who runs a news account would: short, casual, varied. You do NOT sound like ChatGPT.

Hard rules:
- Max 270 characters total (leaves room for the URL).
- Never use em-dashes (—). Use commas, periods, or line breaks.
- Never use these words: delve, tapestry, comprehensive, moreover, furthermore, in conclusion, leverage, foster, navigate, landscape, paradigm, robust, seamless, embark, journey.
- No hashtags unless one is genuinely a real ticker or trend ($NVDA, #IPL).
- No "Breaking:" prefix. No "JUST IN:" unless the story is literally minutes old.
- Mix it up: sometimes a flat fact, sometimes a hot take, sometimes a question, sometimes a one-line setup + payoff on next line.
- Lowercase openers are fine sometimes. Don't always start with a capital.
- Curiosity gap is good. Don't give away the punchline if the article has a number or twist.
- Never start the same way twice (avoid "X just...", "X announced...", "X is...").

Output ONLY the tweet body. No quotes, no labels, no explanation.`;

interface Draft {
  title: string;
  url: string;
  tweet: string;
  category: string | null;
}

async function draftTweet(title: string, dek: string | null, category: string | null): Promise<string> {
  const prompt = `Article headline: ${title}
${dek ? `Subhead: ${dek}\n` : ""}${category ? `Category: ${category}\n` : ""}
Write ONE tweet (under 270 chars, no URL — I'll add it). Sound human. Vary the structure from typical news tweets. Don't quote the headline back at me, react to it.`;

  const raw = await generate(prompt, {
    system: SYSTEM,
    temperature: 0.95,
    model: "llama-3.1-8b-instant",
    maxTokens: 200,
  });
  // Strip surrounding quotes / labels the model sometimes adds
  return raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/^(Tweet|Draft|Post)\s*[:\-]\s*/i, "")
    .replace(/—/g, ",") // safety net for em-dashes
    .trim();
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function render(drafts: Draft[]): string {
  const blocks = drafts
    .map((d, i) => {
      const full = `${d.tweet}\n\n${d.url}`;
      return `
    <div style="margin:0 0 24px;padding:18px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
      <div style="font-size:12px;color:#64748b;margin-bottom:8px;">
        #${i + 1}${d.category ? ` · ${escapeHtml(d.category)}` : ""} · ${full.length} chars
      </div>
      <pre style="white-space:pre-wrap;word-wrap:break-word;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.5;color:#0f172a;margin:0;background:#fff;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">${escapeHtml(full)}</pre>
      <div style="margin-top:8px;font-size:12px;">
        <a href="${escapeHtml(d.url)}" style="color:#4f46e5;">view article</a>
      </div>
    </div>`;
    })
    .join("");

  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;padding:24px;font-family:-apple-system,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:14px;padding:28px;">
      <h1 style="margin:0 0 4px;font-size:22px;color:#0b1120;">X drafts — ${drafts.length} post${drafts.length === 1 ? "" : "s"}</h1>
      <p style="margin:0 0 22px;color:#64748b;font-size:14px;">Copy each block, paste into x.com/compose. Already includes the link.</p>
      ${blocks}
      <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;">Auto-generated from articles published in the last ${LOOKBACK_HOURS}h. Re-runs daily.</p>
    </div></body></html>`;
}

async function main() {
  if (!env.RESEND_API_KEY || !env.ALERT_EMAIL) {
    console.log("RESEND_API_KEY or ALERT_EMAIL not set — skipping.");
    return;
  }

  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600_000);
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", type: "NEWS", publishedAt: { gte: since } },
    orderBy: { publishedAt: "desc" },
    take: MAX_ARTICLES,
    select: { title: true, dek: true, slug: true, category: { select: { name: true } } },
  });

  if (articles.length === 0) {
    console.log(`no NEWS in the last ${LOOKBACK_HOURS}h — skipping.`);
    return;
  }

  console.log(`drafting ${articles.length} tweets…`);
  const drafts: Draft[] = [];
  for (const a of articles) {
    try {
      const tweet = await draftTweet(a.title, a.dek, a.category?.name ?? null);
      drafts.push({
        title: a.title,
        url: `${env.SITE_URL}/article/${a.slug}`,
        tweet,
        category: a.category?.name ?? null,
      });
    } catch (e) {
      console.error(`  ✗ ${a.title.slice(0, 60)}: ${(e as Error).message}`);
    }
  }

  if (drafts.length === 0) {
    console.log("no drafts generated — skipping email.");
    return;
  }

  const res = await sendEmail({
    to: env.ALERT_EMAIL,
    subject: `X drafts: ${drafts.length} ready to post`,
    html: render(drafts),
  });
  console.log(res.ok ? `sent ${drafts.length} drafts to ${env.ALERT_EMAIL}` : `failed: ${res.error}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
