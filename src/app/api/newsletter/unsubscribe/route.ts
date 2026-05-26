import { prisma } from "@/lib/db";

// One-click unsubscribe via the per-subscriber token embedded in each email.
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (token) {
    await prisma.newsletterSubscriber.deleteMany({ where: { unsubToken: token } });
  }
  return new Response(
    `<!doctype html><html><body style="font-family:system-ui;max-width:480px;margin:80px auto;text-align:center;color:#0b1120;">
      <h1 style="font-family:Georgia,serif;">You're unsubscribed</h1>
      <p style="color:#475569;">You won't receive any more emails from us. Changed your mind? You can re-subscribe anytime on the site.</p>
      <p><a href="/" style="color:#4f46e5;">← Back to the homepage</a></p>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
