// Budget + health report for the autonomous content engine.
//   npx tsx scripts/budget-report.ts
// Estimates daily gpt-oss-120b token consumption from stored article word counts
// (article BODIES run on 120b; QA scoring + cluster planning run on the cheap 8B
// and draw from a separate bucket, so they're excluded here). Compares against
// Groq's free-tier ceiling so we can decide whether to change cadence.

import { prisma } from "../src/lib/db";

const TPD_120B = 200_000; // Groq free-tier daily token limit for gpt-oss-120b
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

  const byDay = new Map<
    string,
    { news: number; blog: number; words: number; tokens: number; withImg: number }
  >();
  for (const a of arts) {
    if (!a.publishedAt) continue;
    const day = istDay(a.publishedAt);
    const row = byDay.get(day) ?? { news: 0, blog: 0, words: 0, tokens: 0, withImg: 0 };
    if (a.type === "NEWS") row.news++;
    else row.blog++;
    row.words += a.wordCount;
    row.tokens += PROMPT_TOKENS + FIELD_TOKENS + Math.round(a.wordCount * WORDS_TO_TOKENS);
    if (a.ogImage) row.withImg++;
    byDay.set(day, row);
  }

  console.log("\n=== Content + estimated gpt-oss-120b token burn (by IST day) ===");
  console.log("day         news blog  totalWords   ~120b tokens   vs 200k cap   images");
  for (const [day, r] of [...byDay.entries()].sort()) {
    const pct = ((r.tokens / TPD_120B) * 100).toFixed(0);
    const total = r.news + r.blog;
    console.log(
      `${day}   ${String(r.news).padStart(3)} ${String(r.blog).padStart(4)}  ${String(
        r.words,
      ).padStart(10)}   ${String(r.tokens).padStart(10)}    ${pct.padStart(4)}%        ${r.withImg}/${total}`,
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
