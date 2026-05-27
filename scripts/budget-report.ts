// Budget + health report for the autonomous content engine.
//   npx tsx scripts/budget-report.ts
// Article bodies run on two SEPARATE Groq rate-limit buckets:
//   • NEWS pillars → gpt-oss-120b  (≈200k tokens/day)
//   • BLOG bodies  → gpt-oss-20b   (≈200k tokens/day)
// (QA scoring + cluster planning run on llama-3.1-8b — a third bucket — and are
// excluded here.) We estimate each bucket's daily burn from stored word counts
// and compare against its cap, to decide whether we can speed up the cadence.

import { prisma } from "../src/lib/db";

const TPD = 200_000; // Groq free-tier daily token limit (per model bucket)
const PROMPT_TOKENS = 1_800; // structured prompt + system, per article body
const FIELD_TOKENS = 220; // title/dek/excerpt/seo/faq/sources JSON overhead
const WORDS_TO_TOKENS = 1.4; // English body words → tokens

// Group timestamps by IST calendar day (the site's audience timezone).
function istDay(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

async function dbReport() {
  const since = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const arts = await prisma.article.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since } },
    select: { type: true, wordCount: true, publishedAt: true, ogImage: true },
    orderBy: { publishedAt: "asc" },
  });

  const tokensFor = (words: number) =>
    PROMPT_TOKENS + FIELD_TOKENS + Math.round(words * WORDS_TO_TOKENS);

  const byDay = new Map<
    string,
    { news: number; blog: number; tok120b: number; tok20b: number; withImg: number }
  >();
  for (const a of arts) {
    if (!a.publishedAt) continue;
    const day = istDay(a.publishedAt);
    const row = byDay.get(day) ?? { news: 0, blog: 0, tok120b: 0, tok20b: 0, withImg: 0 };
    if (a.type === "NEWS") {
      row.news++;
      row.tok120b += tokensFor(a.wordCount); // news pillars → gpt-oss-120b
    } else {
      row.blog++;
      row.tok20b += tokensFor(a.wordCount); // blog bodies → gpt-oss-20b
    }
    if (a.ogImage) row.withImg++;
    byDay.set(day, row);
  }

  const pct = (t: number) => `${((t / TPD) * 100).toFixed(0)}%`.padStart(5);
  console.log("\n=== Daily content + per-bucket token burn vs 200k/day cap (IST) ===");
  console.log("day          news  120b-tok (cap%)   blog  20b-tok (cap%)   images");
  for (const [day, r] of [...byDay.entries()].sort()) {
    const total = r.news + r.blog;
    console.log(
      `${day}   ${String(r.news).padStart(4)}  ${String(r.tok120b).padStart(8)} (${pct(
        r.tok120b,
      )})  ${String(r.blog).padStart(4)}  ${String(r.tok20b).padStart(8)} (${pct(
        r.tok20b,
      )})   ${r.withImg}/${total}`,
    );
  }
}

async function actionsReport() {
  const token = process.env.GH_TOKEN;
  if (!token) {
    console.log("\n(Set GH_TOKEN to also pull GitHub Actions cycle health.)");
    return;
  }
  const res = await fetch(
    "https://api.github.com/repos/nils44344/autonews-ai/actions/workflows/cycle.yml/runs?per_page=10",
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) {
    console.log(`\n(GitHub API ${res.status})`);
    return;
  }
  const data = (await res.json()) as {
    workflow_runs: { created_at: string; status: string; conclusion: string | null }[];
  };
  console.log("\n=== Last 10 'Content cycle' runs ===");
  for (const r of data.workflow_runs) {
    console.log(`${r.created_at}   ${r.status.padEnd(11)} ${r.conclusion ?? ""}`);
  }
}

(async () => {
  await dbReport();
  await actionsReport();
  await prisma.$disconnect();
})();
