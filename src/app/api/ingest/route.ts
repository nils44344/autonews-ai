import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { findBrand } from "@/lib/brands";

// POST /api/ingest — protected by INGEST_API_KEY header. Accepts raw
// automotive data and persists Brand / BrandSentiment / PricePrediction
// records, then revalidates affected pages so the dashboard reflects the
// new data within seconds.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  brandSlug: z.string().min(1),
  // Optional sentiment block
  sentiment: z.object({
    score:        z.number().min(-100).max(100),
    mentionCount: z.number().int().nonnegative(),
    positivePct:  z.number().min(0).max(100),
    negativePct:  z.number().min(0).max(100),
    neutralPct:   z.number().min(0).max(100),
    topTopics:    z.array(z.string()).max(20).default([]),
    asOf:         z.string().datetime().optional(),
  }).optional(),
  // Optional list of price predictions (one or more models)
  predictions: z.array(z.object({
    modelName:         z.string().min(1),
    category:          z.string().min(1),
    currentPriceUsd:   z.number().positive(),
    predictedPriceUsd: z.number().positive(),
    lowUsd:            z.number().positive(),
    highUsd:           z.number().positive(),
    confidence:        z.number().min(0).max(100),
    trend:             z.enum(["up", "down", "flat"]).default("flat"),
    horizonDays:       z.number().int().positive().default(30),
    asOf:              z.string().datetime().optional(),
  })).default([]),
  // Optional market data points
  marketData: z.array(z.object({
    category: z.string().min(1),
    metric:   z.string().min(1),
    value:    z.number(),
    unit:     z.string().optional(),
    asOf:     z.string().datetime().optional(),
  })).default([]),
});

export async function POST(req: Request) {
  // Auth
  const key = req.headers.get("x-api-key") ?? "";
  if (key !== env.INGEST_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse + validate
  const json = await req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request", issues: parsed.error.issues }, { status: 400 });
  }
  const d = parsed.data;

  // Ensure brand exists (auto-create from seed list if known)
  const seed = findBrand(d.brandSlug);
  if (!seed) {
    return NextResponse.json({ error: `Unknown brand slug: ${d.brandSlug}` }, { status: 404 });
  }

  const brand = await prisma.brand.upsert({
    where:  { slug: d.brandSlug },
    create: { slug: d.brandSlug, name: seed.name, country: seed.country, founded: seed.founded },
    update: { name: seed.name, country: seed.country, founded: seed.founded },
  });

  // Write sentiment
  if (d.sentiment) {
    await prisma.brandSentiment.create({
      data: {
        brandId:      brand.id,
        score:        d.sentiment.score,
        mentionCount: d.sentiment.mentionCount,
        positivePct:  d.sentiment.positivePct,
        negativePct:  d.sentiment.negativePct,
        neutralPct:   d.sentiment.neutralPct,
        topTopics:    d.sentiment.topTopics,
        asOf:         d.sentiment.asOf ? new Date(d.sentiment.asOf) : new Date(),
      },
    });
  }

  // Write predictions
  for (const p of d.predictions) {
    await prisma.pricePrediction.create({
      data: {
        brandId:           brand.id,
        modelName:         p.modelName,
        category:          p.category,
        currentPriceUsd:   p.currentPriceUsd,
        predictedPriceUsd: p.predictedPriceUsd,
        lowUsd:            p.lowUsd,
        highUsd:           p.highUsd,
        confidence:        p.confidence,
        trend:             p.trend,
        horizonDays:       p.horizonDays,
        asOf:              p.asOf ? new Date(p.asOf) : new Date(),
      },
    });
  }

  // Write market-data points
  for (const m of d.marketData) {
    await prisma.marketData.create({
      data: {
        brandId:  brand.id,
        category: m.category,
        metric:   m.metric,
        value:    m.value,
        unit:     m.unit,
        asOf:     m.asOf ? new Date(m.asOf) : new Date(),
      },
    });
  }

  // Revalidate affected pages so the dashboard updates in seconds.
  const revalidated: string[] = [];
  try {
    revalidatePath("/");                                   revalidated.push("/");
    revalidatePath(`/trends/${d.brandSlug}`);              revalidated.push(`/trends/${d.brandSlug}`);
    const cats = new Set([
      ...d.predictions.map((p) => p.category.toLowerCase()),
      ...d.marketData.map((m)  => m.category.toLowerCase()),
    ]);
    for (const c of cats) {
      revalidatePath(`/predictions/${c}`);
      revalidated.push(`/predictions/${c}`);
    }
    revalidatePath("/sitemap.xml");                        revalidated.push("/sitemap.xml");
  } catch { /* revalidate is best-effort */ }

  // Audit log
  await prisma.jobLog.create({
    data: {
      job: "ingest",
      status: "ok",
      message: `${d.brandSlug}: sentiment=${d.sentiment ? 1 : 0} predictions=${d.predictions.length} market=${d.marketData.length}`,
    },
  }).catch(() => {});

  return NextResponse.json({ ok: true, brand: d.brandSlug, revalidated });
}

// GET — health probe
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "ingest", method: "POST" });
}
