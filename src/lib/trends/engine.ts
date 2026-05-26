import type { Source } from "@prisma/client";
import { prisma } from "../db";
import { extractKeywords, similarity, slug, uniqueSlug } from "../utils";
import { scoreTopic } from "./scoring";
import { getFetcher } from "./sources";
import type { RawSignal } from "./types";

const SIMILARITY_THRESHOLD = 0.42;

// Hard cap per source. Without this, one slow/hanging feed makes the whole
// Promise.all wait minutes (trend collection used to take ~15 min). Now the
// cycle finishes in seconds and simply skips whatever didn't answer in time.
const SOURCE_TIMEOUT_MS = 9000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`source timeout after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

interface Cluster {
  title: string;
  category: string;
  signals: { signal: RawSignal; source: Source }[];
}

/** Fetch every enabled source, persisting raw signals and source status. */
export async function collectSignals(): Promise<{ signal: RawSignal; source: Source }[]> {
  const sources = await prisma.source.findMany({ where: { enabled: true } });
  const collected: { signal: RawSignal; source: Source }[] = [];

  await Promise.all(
    sources.map(async (source) => {
      try {
        const fetcher = getFetcher(source.type);
        const signals = await withTimeout(
          fetcher.fetch({
            type: source.type,
            name: source.name,
            url: source.url ?? undefined,
            category: source.category,
            weight: source.weight,
          }),
          SOURCE_TIMEOUT_MS,
        );
        for (const signal of signals) collected.push({ signal, source });

        await prisma.source.update({
          where: { id: source.id },
          data: { lastFetched: new Date(), lastStatus: `ok:${signals.length}` },
        });
      } catch (err) {
        await prisma.source.update({
          where: { id: source.id },
          data: { lastFetched: new Date(), lastStatus: `error:${(err as Error).message}`.slice(0, 200) },
        });
      }
    }),
  );

  return collected;
}

/** Greedy single-pass clustering by title similarity. */
export function clusterSignals(items: { signal: RawSignal; source: Source }[]): Cluster[] {
  const clusters: Cluster[] = [];
  for (const item of items) {
    let best: Cluster | null = null;
    let bestSim = SIMILARITY_THRESHOLD;
    for (const c of clusters) {
      const sim = similarity(item.signal.title, c.title);
      if (sim > bestSim) {
        bestSim = sim;
        best = c;
      }
    }
    if (best) {
      best.signals.push(item);
    } else {
      clusters.push({
        title: item.signal.title,
        category: item.signal.category || item.source.category,
        signals: [item],
      });
    }
  }
  return clusters;
}

/**
 * Full trend cycle: collect → cluster → score → persist ranked topics.
 * Returns the number of topics created/updated.
 */
export async function runTrendCycle(): Promise<{ topics: number; signals: number }> {
  const items = await collectSignals();
  const clusters = clusterSignals(items);
  const now = Date.now();

  let topicCount = 0;

  // Score + noise-filter every cluster IN MEMORY first (no DB), then persist only
  // the highest-scoring few. Writing all 200-300 clusters per cycle hammered
  // Neon's free tier (connection resets) — and we only ever generate from the
  // top handful anyway.
  const MAX_PERSIST = 40;
  const scored = clusters
    .map((cluster) => {
      const distinctSources = new Set(cluster.signals.map((s) => s.source.id)).size;
      const avgPopularity =
        cluster.signals.reduce((a, s) => a + s.signal.score, 0) / cluster.signals.length;
      const weightSum = cluster.signals.reduce((a, s) => a + s.source.weight, 0);
      const combinedText = cluster.signals
        .map((s) => `${s.signal.title}. ${s.signal.summary ?? ""}`)
        .join(" ");
      const keywords = extractKeywords(combinedText, 8);
      const scores = scoreTopic({
        popularity: avgPopularity,
        sourceCount: distinctSources,
        ageHours: 0,
        weightSum,
        keywordSpecificity: keywords.length,
      });
      return { cluster, distinctSources, avgPopularity, keywords, scores };
    })
    .filter((x) => !(x.distinctSources < 2 && x.avgPopularity < 40)) // drop lone low-pop noise
    .sort((a, b) => b.scores.finalScore - a.scores.finalScore)
    .slice(0, MAX_PERSIST);

  // Fetch the recent-topics dedup window ONCE (new topics appended in-memory).
  const recent = await prisma.trendTopic.findMany({
    where: { createdAt: { gte: new Date(now - 1000 * 60 * 60 * 24) } },
    select: { id: true, title: true, slug: true },
    take: 500,
  });

  for (const { cluster, distinctSources, keywords, scores } of scored) {
    try {
      // Merge into an existing recent topic if the title is similar, else create.
      const match = recent.find((t) => similarity(t.title, cluster.title) > SIMILARITY_THRESHOLD);

      let topic;
      if (match) {
        topic = await prisma.trendTopic.update({
          where: { id: match.id },
          data: { sourceCount: distinctSources, keywords, ...scores, updatedAt: new Date() },
        });
      } else {
        topic = await prisma.trendTopic.create({
          data: {
            title: cluster.title.slice(0, 200),
            slug: uniqueSlug(cluster.title),
            category: cluster.category,
            keywords,
            sourceCount: distinctSources,
            status: "RANKED",
            ...scores,
          },
        });
        recent.push({ id: topic.id, title: topic.title, slug: topic.slug });
      }

      await prisma.trendSignal.createMany({
        data: cluster.signals.map((s) => ({
          sourceId: s.source.id,
          topicId: topic.id,
          title: s.signal.title.slice(0, 300),
          url: s.signal.url,
          summary: s.signal.summary,
          score: s.signal.score,
          raw: (s.signal.raw ?? undefined) as object | undefined,
        })),
      });
      topicCount++;
    } catch (err) {
      // A transient Neon connection blip on one topic must not kill the cycle.
      console.error("  trend persist skipped:", (err as Error).message.slice(0, 80));
    }
  }

  await prisma.jobLog.create({
    data: { job: "trend-cycle", status: "ok", meta: { topics: topicCount, signals: items.length } },
  });

  return { topics: topicCount, signals: items.length };
}

/** Keyword-set Jaccard — same event from different outlets shares keywords even
 *  when the headlines are worded differently. */
function keywordOverlap(a: string[], b: string[]): number {
  const sa = new Set(a.map((s) => s.toLowerCase()));
  const sb = new Set(b.map((s) => s.toLowerCase()));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / (sa.size + sb.size - inter);
}

function isSameStory(aTitle: string, aKw: string[], bTitle: string, bKw: string[]): boolean {
  return similarity(aTitle, bTitle) > 0.35 || keywordOverlap(aKw, bKw) > 0.45;
}

/**
 * Pick the top N ranked topics that don't yet have an article — and that aren't
 * near-duplicates of each other or of anything published in the last 3 days.
 * This stops the pipeline burning generation on the same story (same event,
 * different outlet headlines) over and over.
 */
export async function selectTopTopics(limit: number) {
  const candidates = await prisma.trendTopic.findMany({
    where: { status: "RANKED", articles: { none: {} } },
    orderBy: { finalScore: "desc" },
    take: Math.max(limit * 10, 50),
  });

  const recent = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      publishedAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
    },
    select: { title: true, keywords: true },
    orderBy: { publishedAt: "desc" },
    take: 200,
  });

  const picked: typeof candidates = [];
  for (const c of candidates) {
    if (picked.length >= limit) break;
    if (recent.some((r) => isSameStory(c.title, c.keywords, r.title, r.keywords))) continue;
    if (picked.some((p) => isSameStory(c.title, c.keywords, p.title, p.keywords))) continue;
    picked.push(c);
  }
  return picked;
}

export { slug };
