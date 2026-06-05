// One-shot health scan: counts publishes, lists recent errors per job, checks
// last cycle activity. Run after periods of no human attention to see if
// anything quietly broke.
import { prisma } from "../src/lib/db";

const H = (n: number) => new Date(Date.now() - n * 3600_000);

async function main() {
  console.log("=== AUTONEWS-AI ERROR SCAN ===\n");

  // 1. Article publish rate (last 24h, 72h, 7d)
  for (const [label, hrs] of [["24h", 24], ["72h", 72], ["7d", 168]] as const) {
    const news = await prisma.article.count({
      where: { type: "NEWS", status: "PUBLISHED", publishedAt: { gte: H(hrs) } },
    });
    const blog = await prisma.article.count({
      where: { type: "BLOG", status: "PUBLISHED", publishedAt: { gte: H(hrs) } },
    });
    const rej = await prisma.article.count({
      where: { status: "REJECTED", updatedAt: { gte: H(hrs) } },
    });
    console.log(`PUBLISH ${label}: news=${news} blog=${blog} rejected=${rej}`);
  }

  // 2. Last successful publish (gap = stalled?)
  const last = await prisma.article.findFirst({
    where: { status: "PUBLISHED", type: "NEWS" },
    orderBy: { publishedAt: "desc" },
    select: { publishedAt: true, title: true },
  });
  if (last?.publishedAt) {
    const gap = (Date.now() - last.publishedAt.getTime()) / 3600_000;
    console.log(`\nLAST NEWS: ${gap.toFixed(1)}h ago — "${last.title.slice(0, 70)}"`);
    if (gap > 6) console.log("⚠️  >6h gap — engine may be stalled");
  }

  // 3. Error counts per job (last 72h)
  console.log("\n=== JOB LOG ERRORS (last 72h) ===");
  const errs = await prisma.jobLog.groupBy({
    by: ["job"],
    where: { status: "error", createdAt: { gte: H(72) } },
    _count: { _all: true },
  });
  if (errs.length === 0) console.log("(none)");
  for (const e of errs.sort((a, b) => b._count._all - a._count._all)) {
    console.log(`  ${e.job}: ${e._count._all}`);
  }

  // 4. Top distinct error messages (recent)
  console.log("\n=== RECENT ERROR SAMPLES (last 48h) ===");
  const samples = await prisma.jobLog.findMany({
    where: { status: "error", createdAt: { gte: H(48) } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { job: true, message: true, createdAt: true },
  });
  if (samples.length === 0) console.log("(none)");
  for (const s of samples) {
    const t = s.createdAt.toISOString().slice(5, 16).replace("T", " ");
    console.log(`  [${t}] ${s.job}: ${(s.message ?? "").slice(0, 140)}`);
  }

  // 5. Health watchdog state
  console.log("\n=== HEALTH WATCHDOG (last 24h) ===");
  const hw = await prisma.jobLog.findMany({
    where: { job: "health", createdAt: { gte: H(24) } },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { status: true, message: true, createdAt: true },
  });
  if (hw.length === 0) console.log("(no health entries — watchdog may not be running)");
  for (const h of hw) {
    const t = h.createdAt.toISOString().slice(5, 16).replace("T", " ");
    console.log(`  [${t}] ${h.status}: ${(h.message ?? "").slice(0, 120)}`);
  }

  // 6. Drafts piling up (a publish failure tell)
  const stuckDrafts = await prisma.article.count({
    where: { status: "DRAFT", createdAt: { gte: H(48) } },
  });
  console.log(`\nDRAFTS waiting (created <48h): ${stuckDrafts}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
