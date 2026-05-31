// Real-time email of a single human-style X (Twitter) draft, fired the moment
// a NEWS article publishes. Lets the owner paste-and-post within seconds so
// the @AutoNewsAI feed stays live 24/7 even though X killed the free posting
// tier. Uses the cheap 8b model + Resend; fire-and-forget so it never blocks
// publish.
import { generate } from "../ai";
import { env } from "../env";
import { sendEmail } from "../email";

const SYSTEM = `You write tweets the way a real person who runs a news account would: short, casual, varied. You do NOT sound like ChatGPT.

Hard rules:
- Max 270 characters total (leaves room for the URL).
- Never use em-dashes. Use commas, periods, or line breaks.
- Never use these words: delve, tapestry, comprehensive, moreover, furthermore, in conclusion, leverage, foster, navigate, landscape, paradigm, robust, seamless, embark, journey.
- No hashtags unless one is a real ticker or trend ($NVDA, #IPL).
- No "Breaking:" prefix unless the story is literally minutes old.
- Mix it up: sometimes a flat fact, sometimes a hot take, sometimes a question, sometimes a setup + payoff on next line.
- Lowercase openers are fine. Don't always start with a capital.
- Curiosity gap is good. Don't give away a number or twist if the article has one.

Output ONLY the tweet body. No quotes, no labels, no explanation.`;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

export async function emailXDraft(opts: {
  title: string;
  dek: string | null;
  url: string;
  category: string | null;
}): Promise<void> {
  if (!env.RESEND_API_KEY || !env.ALERT_EMAIL) return;

  let tweet: string;
  try {
    const raw = await generate(
      `Article headline: ${opts.title}
${opts.dek ? `Subhead: ${opts.dek}\n` : ""}${opts.category ? `Category: ${opts.category}\n` : ""}
Write ONE tweet (under 270 chars, no URL). Sound human. Don't quote the headline back, react to it.`,
      { system: SYSTEM, temperature: 0.95, model: "llama-3.1-8b-instant", maxTokens: 200 },
    );
    tweet = raw
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^(Tweet|Draft|Post)\s*[:\-]\s*/i, "")
      .replace(/—/g, ",")
      .trim();
  } catch {
    // Fallback: just title + url so the email still goes out
    tweet = opts.title;
  }

  const full = `${tweet}\n\n${opts.url}`;
  const html = `<!doctype html><html><body style="margin:0;background:#f1f5f9;padding:24px;font-family:-apple-system,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;padding:24px;">
      <div style="font-size:12px;color:#64748b;margin-bottom:8px;">
        new X draft${opts.category ? ` · ${esc(opts.category)}` : ""} · ${full.length} chars
      </div>
      <pre style="white-space:pre-wrap;word-wrap:break-word;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.55;color:#0f172a;margin:0;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;">${esc(full)}</pre>
      <p style="margin:14px 0 0;font-size:13px;">
        <a href="https://x.com/compose/post" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:8px 14px;border-radius:8px;font-weight:600;">Open X composer</a>
        <a href="${esc(opts.url)}" style="margin-left:10px;color:#4f46e5;">view article</a>
      </p>
    </div></body></html>`;

  await sendEmail({
    to: env.ALERT_EMAIL,
    subject: `[X] ${opts.title.slice(0, 80)}`,
    html,
  }).catch(() => {});
}
