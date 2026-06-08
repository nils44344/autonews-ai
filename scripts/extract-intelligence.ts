// Auto-extract intelligence from the latest news cycle. Runs as the last
// step of cycle.yml. For each NEWS article published in the last N hours:
//   - Ask the LLM to extract { isSignal, isOpportunity, mentionedTools,
//     mentionedStartups, signalKind, momentum }
//   - If isSignal       → create a row in Signal
//   - If isOpportunity  → create a Draft Opportunity (editor approves later)
//   - If mentionedTools → bump those tools' momentumScore
//   - If mentionedStartups → bump those startups' momentumScore
//
// This makes the homepage / radar / ticker LIVE — they update every 4h
// with real intelligence pulled from the news pipeline, instead of staying
// frozen on the seed data.

import { generateJSON } from "../src/lib/ai";
import { prisma } from "../src/lib/db";

const LOOKBACK_HOURS = 6;

const EXTRACT_SCHEMA = `Return JSON only, matching exactly this shape:
{
  "isSignal": boolean,                  // is this a market-moving signal?
  "signalKind": "LAUNCH" | "FUNDING" | "GROWTH" | "VIRAL_POST" | "RESEARCH" | "HIRING" | "ACQUISITION" | null,
  "momentumScore": number,              // 0-100, how big a deal
  "isOpportunity": boolean,             // does this hint at a build-able opportunity?
  "opportunitySeed": string | null,     // 1-line opportunity description
  "mentionedTools": string[],           // slugs from our tool catalog
  "mentionedStartups": string[]         // slugs from our startup catalog
}`;

async function extractFromArticle(article: { id: string; title: string; dek: string | null; body: string; categorySlug: string | null }, tools: { slug: string; name: string }[], startups: { slug: string; name: string }[]) {
  const toolList = tools.map((t) => `${t.slug} (${t.name})`).join(", ");
  const startupList = startups.map((s) => `${s.slug} (${s.name})`).join(", ");

  const prompt = `Analyse this news article and extract intelligence.

Article:
Title: ${article.title}
Dek: ${article.dek ?? ""}
Body: ${article.body.slice(0, 1200)}

Known tools in our catalog (slug + name): ${toolList}
Known startups in our catalog: ${startupList}

${EXTRACT_SCHEMA}

Rules:
- isSignal=true only if the article describes a concrete event (launch, funding, growth burst, viral moment, breakthrough, key hire, acquisition).
- signalKind is required when isSignal=true.
- momentumScore: 0-100, how impactful is this for AI builders. >=80 = HOT.
- isOpportunity=true only if the article suggests a clear build-able play.
- mentionedTools / mentionedStartups: only return slugs that EXACTLY appear in the lists above.`;

  try {
    const raw = await generateJSON<{
      isSignal: boolean;
      signalKind: string | null;
      momentumScore: number;
      isOpportunity: boolean;
      opportunitySeed: string | null;
      mentionedTools: string[];
      mentionedStartups: string[];
    }>(prompt, { model: "llama-3.1-8b-instant", temperature: 0.2, maxTokens: 500 });
    return raw;
  } catch (e) {
    console.warn(`  ! extract failed for ${article.id}: ${(e as Error).message}`);
    return null;
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function main() {
  const since = new Date(Date.now() - LOOKBACK_HOURS * 3600_000);
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED", type: "NEWS", publishedAt: { gte: since } },
    select: { id: true, title: true, dek: true, body: true, slug: true, category: { select: { slug: true } } },
    orderBy: { publishedAt: "desc" },
  });

  if (articles.length === 0) {
    console.log(`no NEWS in last ${LOOKBACK_HOURS}h — nothing to extract`);
    return;
  }

  const [tools, startups] = await Promise.all([
    prisma.tool.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, name: true } }),
    prisma.startup.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, name: true } }),
  ]);

  console.log(`extracting from ${articles.length} article(s) (last ${LOOKBACK_HOURS}h)…`);

  let signalsCreated = 0;
  let oppsDrafted = 0;
  let toolBumps = 0;
  let startupBumps = 0;

  for (const a of articles) {
    const data = await extractFromArticle({ ...a, categorySlug: a.category?.slug ?? null }, tools, startups);
    if (!data) continue;

    // 1. Create signal
    if (data.isSignal && data.signalKind) {
      const slug = slugify(a.title);
      const exists = await prisma.signal.findUnique({ where: { slug } });
      if (!exists) {
        await prisma.signal.create({
          data: {
            slug,
            title: a.title.slice(0, 200),
            kind: data.signalKind as "LAUNCH" | "FUNDING" | "GROWTH" | "VIRAL_POST" | "RESEARCH" | "HIRING" | "ACQUISITION",
            summary: a.dek ?? a.title,
            sourceLabel: "AutoNews",
            sourceUrl: `https://autonews-ai.live/article/${a.slug}`,
            momentumScore: Math.max(0, Math.min(100, data.momentumScore)),
            reachScore: 60,
            opportunityScore: data.isOpportunity ? 80 : 50,
            isHot: data.momentumScore >= 80,
            toolSlug: data.mentionedTools[0] ?? null,
            startupSlug: data.mentionedStartups[0] ?? null,
            status: "PUBLISHED",
            publishedAt: new Date(),
          },
        }).catch((e) => console.warn(`  ! signal create failed: ${(e as Error).message}`));
        signalsCreated++;
      }
    }

    // 2. Draft opportunity (editor reviews)
    if (data.isOpportunity && data.opportunitySeed) {
      const slug = slugify(data.opportunitySeed).slice(0, 60);
      const exists = await prisma.opportunity.findUnique({ where: { slug } });
      if (!exists) {
        await prisma.opportunity.create({
          data: {
            slug,
            title: data.opportunitySeed.slice(0, 140),
            kind: "BUSINESS",
            summary: a.dek ?? a.title,
            whyItMatters: `Surfaced from "${a.title}". The signal: ${a.dek ?? "see source"}.`,
            relatedArticleIds: [a.id],
            demandScore: 55,
            growthScore: data.momentumScore,
            competitionScore: 50,
            monetizationScore: 60,
            difficultyScore: 50,
            opportunityScore: 0,
            status: "DRAFT", // owner reviews + scores
          },
        }).catch((e) => console.warn(`  ! opportunity create failed: ${(e as Error).message}`));
        oppsDrafted++;
      }
    }

    // 3. Bump tool momentum (each mention adds 3 points, capped at 100)
    for (const slug of data.mentionedTools) {
      const t = await prisma.tool.findUnique({ where: { slug } });
      if (t) {
        await prisma.tool.update({
          where: { slug },
          data: { momentumScore: Math.min(100, t.momentumScore + 3) },
        });
        toolBumps++;
      }
    }

    // 4. Bump startup momentum
    for (const slug of data.mentionedStartups) {
      const s = await prisma.startup.findUnique({ where: { slug } });
      if (s) {
        await prisma.startup.update({
          where: { slug },
          data: { momentumScore: Math.min(100, s.momentumScore + 3) },
        });
        startupBumps++;
      }
    }
  }

  console.log(`✓ signals=${signalsCreated}  opps_drafted=${oppsDrafted}  tool_bumps=${toolBumps}  startup_bumps=${startupBumps}`);

  // Log to job history so the watchdog can see this ran.
  await prisma.jobLog.create({
    data: {
      job: "extract-intelligence",
      status: "ok",
      message: `signals=${signalsCreated} opps=${oppsDrafted} tools=${toolBumps} startups=${startupBumps}`,
    },
  }).catch(() => {});
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
