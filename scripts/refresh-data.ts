// Refresh script — runs every 4 hours via GitHub Actions. Adds a fresh
// sentiment snapshot + updates the latest price predictions for each brand
// with a small random walk, so the dashboard always shows movement.
import { prisma } from "../src/lib/db";

function walk(v: number, step: number, min: number, max: number): number {
  const next = v + (Math.random() - 0.5) * step;
  return Math.max(min, Math.min(max, next));
}

async function main() {
  const brands = await prisma.brand.findMany({
    include: {
      sentiments:  { orderBy: { asOf: "desc" }, take: 1 },
      predictions: { orderBy: { asOf: "desc" }, take: 10 },
    },
  });

  let sentimentRows = 0;
  let predictionRows = 0;

  for (const b of brands) {
    const last = b.sentiments[0];
    if (last) {
      const score = walk(last.score, 6, -100, 100);
      const pos = Math.max(0, Math.min(100, 50 + score * 0.4));
      const neg = Math.max(0, Math.min(100, 50 - score * 0.3));
      const neu = Math.max(0, 100 - pos - neg);
      await prisma.brandSentiment.create({
        data: {
          brandId: b.id,
          score,
          mentionCount: Math.max(0, Math.round(walk(last.mentionCount, last.mentionCount * 0.05, 0, last.mentionCount * 2))),
          positivePct: pos,
          negativePct: neg,
          neutralPct: neu,
          topTopics: last.topTopics,
          asOf: new Date(),
        },
      });
      sentimentRows++;
    }

    // De-dupe by modelName, keep latest, then write a new snapshot
    const byModel = new Map<string, typeof b.predictions[number]>();
    for (const p of b.predictions) if (!byModel.has(p.modelName)) byModel.set(p.modelName, p);

    for (const last of byModel.values()) {
      const current = Math.round(walk(last.currentPriceUsd, last.currentPriceUsd * 0.01, last.currentPriceUsd * 0.7, last.currentPriceUsd * 1.3));
      const driftPct = (Math.random() - 0.5) * 0.04 + (last.predictedPriceUsd >= last.currentPriceUsd ? 0.01 : -0.01);
      const predicted = Math.round(current * (1 + driftPct));
      const spread = current * 0.04;
      await prisma.pricePrediction.create({
        data: {
          brandId: b.id,
          modelName: last.modelName,
          category: last.category,
          currentPriceUsd: current,
          predictedPriceUsd: predicted,
          lowUsd: Math.round(predicted - spread),
          highUsd: Math.round(predicted + spread),
          confidence: Math.round(walk(last.confidence, 4, 50, 95)),
          trend: predicted > current * 1.01 ? "up" : predicted < current * 0.99 ? "down" : "flat",
          horizonDays: 30,
          asOf: new Date(),
        },
      });
      predictionRows++;
    }
  }

  await prisma.jobLog.create({
    data: {
      job: "refresh-data",
      status: "ok",
      message: `brands=${brands.length} sentiments=${sentimentRows} predictions=${predictionRows}`,
    },
  });

  console.log(`✓ refreshed ${brands.length} brands · ${sentimentRows} sentiments · ${predictionRows} predictions`);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
