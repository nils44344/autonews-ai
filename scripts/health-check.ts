// 24/7 health watchdog. Runs in the cloud on a short interval and emails
// ALERT_EMAIL the moment something breaks: site down / serving an error page,
// sitemap broken, DB unreachable, or the content engine stalled (no fresh
// articles). Sends at most one alert per REALERT_HOURS while broken, and one
// "all good" heartbeat per day. Never throws.
import { prisma } from "../src/lib/db";
import { env } from "../src/lib/env";
import { sendEmail } from "../src/lib/email";

const STALE_HOURS = 10; // 3h cadence → >10h with no new article = engine stuck
const REALERT_HOURS = 3; // don't re-spam while an outage persists

type Check = { name: string; ok: boolean; detail: string };

async function run(name: string, fn: () => Promise<string>): Promise<Check> {
  try {
    return { name, ok: true, detail: await fn() };
  } catch (e) {
    return { name, ok: false, detail: (e as Error).message.slice(0, 160) };
  }
}

function istDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

async function main() {
  const checks: Check[] = [];

  checks.push(
    await run("Homepage", async () => {
      const res = await fetch(env.SITE_URL, { headers: { "user-agent": "autonews-healthcheck" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      if (!html.includes("AutoNews")) throw new Error("missing expected content (error page?)");
      return "200 OK";
    }),
  );

  checks.push(
    await run("Sitemap", async () => {
      const res = await fetch(`${env.SITE_URL}/sitemap.xml`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return "200 OK";
    }),
  );

  checks.push(
    await run("Content engine", async () => {
      const latest = await prisma.article.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        select: { publishedAt: true },
      });
      if (!latest?.publishedAt) throw new Error("no published articles");
      const ageH = (Date.now() - latest.publishedAt.getTime()) / 3.6e6;
      if (ageH > STALE_HOURS) throw new Error(`newest article ${ageH.toFixed(1)}h old — engine stalled`);
      return `fresh (${ageH.toFixed(1)}h ago)`;
    }),
  );

  const failures = checks.filter((c) => !c.ok);
  const allOk = failures.length === 0;
  const summary = checks.map((c) => `${c.ok ? "OK " : "FAIL"} | ${c.name}: ${c.detail}`).join("\n");
  console.log(summary);

  await prisma.jobLog.create({
    data: { job: "health", status: allOk ? "ok" : "error", message: summary.slice(0, 500) },
  });

  if (!env.ALERT_EMAIL) {
    console.log("(ALERT_EMAIL not set — skipping email)");
    await prisma.$disconnect();
    return;
  }

  if (!allOk) {
    const lastAlert = await prisma.jobLog.findFirst({
      where: { job: "health-alert" },
      orderBy: { createdAt: "desc" },
    });
    const hoursSince = lastAlert ? (Date.now() - lastAlert.createdAt.getTime()) / 3.6e6 : 999;
    if (hoursSince >= REALERT_HOURS) {
      const r = await sendEmail({
        to: env.ALERT_EMAIL,
        subject: "🚨 AutoNews AI — site issue detected",
        html: `<h2 style="color:#b91c1c">Something needs attention on autonews-ai.live</h2>
<pre style="font-size:14px;background:#f3f4f6;padding:12px;border-radius:8px">${summary}</pre>
<p style="color:#6b7280">Checked at ${new Date().toUTCString()}. You'll get at most one alert every ${REALERT_HOURS}h while this persists.</p>`,
      });
      await prisma.jobLog.create({
        data: { job: "health-alert", status: r.ok ? "ok" : "error", message: `sent=${r.ok} ${r.error ?? ""}`.slice(0, 200) },
      });
      console.log("ALERT email:", r.ok ? "sent" : r.error);
    } else {
      console.log(`(re-alert suppressed — last alert ${hoursSince.toFixed(1)}h ago)`);
    }
    await prisma.$disconnect();
    return;
  }

  // All OK → one heartbeat per IST day so you know it's actively watching.
  const lastHb = await prisma.jobLog.findFirst({
    where: { job: "health-heartbeat" },
    orderBy: { createdAt: "desc" },
  });
  if (!lastHb || istDay(lastHb.createdAt) !== istDay(new Date())) {
    const since = new Date(Date.now() - 24 * 3.6e6);
    const published = await prisma.article.count({
      where: { status: "PUBLISHED", publishedAt: { gte: since } },
    });
    const r = await sendEmail({
      to: env.ALERT_EMAIL,
      subject: "✅ AutoNews AI — all systems normal",
      html: `<h2 style="color:#059669">Daily health check: all good</h2>
<pre style="font-size:14px;background:#f3f4f6;padding:12px;border-radius:8px">${summary}</pre>
<p><b>${published}</b> articles published in the last 24h. Watchdog is running 24/7 — you'll only hear from me again if something breaks.</p>`,
    });
    await prisma.jobLog.create({
      data: { job: "health-heartbeat", status: r.ok ? "ok" : "error", message: `sent=${r.ok}` },
    });
    console.log("heartbeat email:", r.ok ? "sent" : r.error);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
