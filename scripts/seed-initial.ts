// Seed the database with realistic initial data for every brand + category.
// Runs once locally; the cron workflow takes over from there.
import { prisma } from "../src/lib/db";
import { TOP_BRANDS } from "../src/lib/brands";

// Brand-specific characteristics — drives realistic sentiment + price ranges.
// Pure heuristic until live data sources are wired.
const PROFILE: Record<string, {
  sentimentBase: number;          // -100..+100
  mentionBase: number;
  topTopics: string[];
  models: { name: string; category: string; price: number; trend: number; conf: number }[];
}> = {
  tesla:         { sentimentBase: 62, mentionBase: 18420, topTopics: ["FSD beta", "Cybertruck", "Shanghai output"],
    models: [{ name: "Model Y",     category: "EV", price: 44990, trend: -0.06, conf: 78 },
             { name: "Model 3",     category: "EV", price: 38990, trend: -0.04, conf: 81 },
             { name: "Cybertruck",  category: "Truck", price: 79990, trend: -0.02, conf: 65 }] },
  toyota:        { sentimentBase: 58, mentionBase: 12100, topTopics: ["RAV4 hybrid", "bZ4X", "supply chain"],
    models: [{ name: "RAV4 Hybrid", category: "Hybrid", price: 31900, trend: 0.02, conf: 86 },
             { name: "Camry",       category: "Sedan",  price: 27900, trend: 0.01, conf: 88 },
             { name: "Tacoma",      category: "Truck",  price: 31500, trend: 0.03, conf: 80 }] },
  ford:          { sentimentBase: 41, mentionBase: 9800, topTopics: ["F-150 Lightning", "Mach-E", "warranty costs"],
    models: [{ name: "F-150 Lightning", category: "Truck", price: 54995, trend: -0.08, conf: 74 },
             { name: "Mustang Mach-E",  category: "EV",    price: 42995, trend: -0.05, conf: 77 },
             { name: "F-150",           category: "Truck", price: 38800, trend: 0.01, conf: 90 }] },
  chevrolet:     { sentimentBase: 38, mentionBase: 7200, topTopics: ["Silverado EV", "Equinox EV", "Bolt return"],
    models: [{ name: "Silverado EV", category: "Truck", price: 67990, trend: -0.04, conf: 72 },
             { name: "Equinox EV",   category: "EV",    price: 34995, trend: -0.06, conf: 76 }] },
  honda:         { sentimentBase: 55, mentionBase: 8900, topTopics: ["Civic Type R", "CR-V hybrid", "Prologue EV"],
    models: [{ name: "CR-V Hybrid", category: "Hybrid", price: 33800, trend: 0.02, conf: 84 },
             { name: "Civic",       category: "Compact", price: 24450, trend: 0.01, conf: 89 }] },
  bmw:           { sentimentBase: 52, mentionBase: 11200, topTopics: ["i5", "M3 CS", "iX upgrades"],
    models: [{ name: "i4",   category: "EV",     price: 52200, trend: -0.03, conf: 75 },
             { name: "X5",   category: "SUV",    price: 65200, trend: 0.02, conf: 82 },
             { name: "M3",   category: "Sports", price: 76000, trend: 0.04, conf: 70 }] },
  "mercedes-benz": { sentimentBase: 49, mentionBase: 9400, topTopics: ["EQS refresh", "G-Wagon EV", "Maybach demand"],
    models: [{ name: "EQS",  category: "EV", price: 105250, trend: -0.07, conf: 72 },
             { name: "GLE",  category: "SUV", price: 64200, trend: 0.01, conf: 81 }] },
  audi:          { sentimentBase: 47, mentionBase: 6800, topTopics: ["Q6 e-tron", "RS6 GT", "PPE platform"],
    models: [{ name: "Q4 e-tron", category: "EV",  price: 50995, trend: -0.04, conf: 76 },
             { name: "Q5",        category: "SUV", price: 44200, trend: 0.01, conf: 83 }] },
  volkswagen:    { sentimentBase: 35, mentionBase: 5600, topTopics: ["ID.4", "Scout brand", "China struggles"],
    models: [{ name: "ID.4", category: "EV",  price: 39995, trend: -0.05, conf: 73 }] },
  porsche:       { sentimentBase: 64, mentionBase: 6200, topTopics: ["Taycan refresh", "Macan EV", "911 hybrid"],
    models: [{ name: "Taycan",   category: "EV",     price: 99400, trend: -0.06, conf: 74 },
             { name: "911",      category: "Sports", price: 116200, trend: 0.03, conf: 80 },
             { name: "Macan EV", category: "EV",     price: 80450, trend: -0.04, conf: 71 }] },
  hyundai:       { sentimentBase: 56, mentionBase: 7800, topTopics: ["Ioniq 5", "Ioniq 6", "EV factory Georgia"],
    models: [{ name: "Ioniq 5", category: "EV", price: 42450, trend: -0.04, conf: 79 },
             { name: "Tucson",  category: "SUV", price: 28700, trend: 0.02, conf: 86 }] },
  kia:           { sentimentBase: 53, mentionBase: 6900, topTopics: ["EV9", "Telluride update", "Optima"],
    models: [{ name: "EV6", category: "EV", price: 42600, trend: -0.05, conf: 76 },
             { name: "Telluride", category: "SUV", price: 36190, trend: 0.03, conf: 84 }] },
  nissan:        { sentimentBase: 34, mentionBase: 5100, topTopics: ["Ariya delays", "Leaf successor", "GT-R sunset"],
    models: [{ name: "Ariya", category: "EV", price: 41060, trend: -0.07, conf: 70 }] },
  rivian:        { sentimentBase: 51, mentionBase: 7600, topTopics: ["R2 reservations", "R3 reveal", "burn rate"],
    models: [{ name: "R1T", category: "Truck", price: 73000, trend: -0.04, conf: 71 },
             { name: "R1S", category: "SUV",   price: 78000, trend: -0.05, conf: 70 }] },
  lucid:         { sentimentBase: 28, mentionBase: 3200, topTopics: ["Gravity SUV", "Air price cuts", "PIF backing"],
    models: [{ name: "Air",     category: "EV",  price: 71400, trend: -0.10, conf: 65 },
             { name: "Gravity", category: "SUV", price: 79900, trend: -0.06, conf: 64 }] },
  byd:           { sentimentBase: 67, mentionBase: 14200, topTopics: ["Seagull export", "Yangwang U8", "EU tariffs"],
    models: [{ name: "Atto 3",  category: "EV", price: 28500, trend: -0.03, conf: 78 },
             { name: "Seagull", category: "EV", price: 11200, trend: -0.02, conf: 82 }] },
  nio:           { sentimentBase: 44, mentionBase: 5800, topTopics: ["battery swap", "Onvo", "EU expansion"],
    models: [{ name: "ET5",  category: "EV", price: 45900, trend: -0.04, conf: 71 }] },
  xpeng:         { sentimentBase: 49, mentionBase: 4900, topTopics: ["X9", "G6", "VW partnership"],
    models: [{ name: "G6", category: "EV", price: 32000, trend: -0.05, conf: 73 }] },
  tata:          { sentimentBase: 58, mentionBase: 6100, topTopics: ["Nexon EV", "Curvv", "Punch"],
    models: [{ name: "Nexon EV", category: "EV", price: 18500, trend: -0.03, conf: 79 },
             { name: "Punch",    category: "SUV", price: 9800, trend: 0.02, conf: 86 }] },
  mahindra:      { sentimentBase: 54, mentionBase: 4200, topTopics: ["BE 6e", "XEV 9e", "Scorpio"],
    models: [{ name: "Scorpio-N", category: "SUV", price: 17500, trend: 0.03, conf: 84 }] },
};

// Default profile for any brand not specifically modelled above.
function defaultProfile(slug: string, name: string) {
  return {
    sentimentBase: 40 + (slug.charCodeAt(0) % 25),
    mentionBase: 1500 + (slug.length * 200),
    topTopics: ["lineup refresh", "EV strategy", "supply chain"],
    models: [
      { name: `${name} Flagship`, category: "SUV", price: 50000 + (slug.charCodeAt(0) % 20) * 1000, trend: 0.02, conf: 70 },
    ],
  };
}

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

async function seedBrand(b: { slug: string; name: string; country: string; founded: number }) {
  const p = PROFILE[b.slug] ?? defaultProfile(b.slug, b.name);

  const brand = await prisma.brand.upsert({
    where:  { slug: b.slug },
    create: { slug: b.slug, name: b.name, country: b.country, founded: b.founded },
    update: { name: b.name, country: b.country, founded: b.founded },
  });

  const score = Math.max(-100, Math.min(100, jitter(p.sentimentBase, 14)));
  const pos = Math.max(0, Math.min(100, 50 + score * 0.4));
  const neg = Math.max(0, Math.min(100, 50 - score * 0.3));
  const neu = Math.max(0, 100 - pos - neg);

  await prisma.brandSentiment.create({
    data: {
      brandId: brand.id,
      score,
      mentionCount: Math.round(jitter(p.mentionBase, p.mentionBase * 0.25)),
      positivePct: pos,
      negativePct: neg,
      neutralPct: neu,
      topTopics: p.topTopics,
      asOf: new Date(),
    },
  });

  for (const m of p.models) {
    const current = Math.round(jitter(m.price, m.price * 0.02));
    const predicted = Math.round(current * (1 + m.trend));
    const spread = current * 0.04;
    await prisma.pricePrediction.create({
      data: {
        brandId: brand.id,
        modelName: m.name,
        category: m.category,
        currentPriceUsd: current,
        predictedPriceUsd: predicted,
        lowUsd: Math.round(predicted - spread),
        highUsd: Math.round(predicted + spread),
        confidence: m.conf,
        trend: m.trend > 0.01 ? "up" : m.trend < -0.01 ? "down" : "flat",
        horizonDays: 30,
        asOf: new Date(),
      },
    });
  }

  console.log(`  ✓ ${b.slug.padEnd(16)} score=${score.toFixed(0).padStart(4)}  models=${p.models.length}`);
}

async function main() {
  console.log(`Seeding ${TOP_BRANDS.length} brands…\n`);
  for (const b of TOP_BRANDS) {
    try { await seedBrand(b); }
    catch (e) { console.warn(`  ! ${b.slug}: ${(e as Error).message}`); }
  }
  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
