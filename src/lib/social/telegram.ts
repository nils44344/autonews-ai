import { env } from "../env";

// Post a published article to the Telegram channel. Sends the image + a caption
// (title, excerpt, link); falls back to a text message if there's no image or
// the photo send fails. Fire-and-forget — never blocks/breaks publishing.
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function postToTelegram(opts: {
  title: string;
  url: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  categorySlug?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chat = env.TELEGRAM_CHANNEL;
  if (!token || !chat) return { ok: false, error: "telegram not configured" };

  const tag = opts.categorySlug ? `#${opts.categorySlug.replace(/[^a-z0-9]/gi, "")}\n` : "";
  // Telegram photo captions cap at 1024 chars — keep it tight.
  const excerpt = opts.excerpt ? `${escapeHtml(opts.excerpt.slice(0, 350))}\n\n` : "";
  const caption = `${tag}<b>${escapeHtml(opts.title)}</b>\n\n${excerpt}<a href="${opts.url}">Read the full story →</a>`;
  const api = (method: string) => `https://api.telegram.org/bot${token}/${method}`;

  try {
    if (opts.imageUrl) {
      const res = await fetch(api("sendPhoto"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chat, photo: opts.imageUrl, caption, parse_mode: "HTML" }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok) return { ok: true };
      // else fall through to a plain text message
    }
    const res = await fetch(api("sendMessage"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: caption, parse_mode: "HTML" }),
    });
    const data = (await res.json()) as { ok?: boolean; description?: string };
    return data.ok ? { ok: true } : { ok: false, error: data.description ?? "send failed" };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
