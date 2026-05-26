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

  for (const cluster of clusters) {
    // Single-source, low-popularity noise: skip to keep the pipeline focused.
    const distinctSources = new Set(cluster.signals.map((s) => s.source.id)).size;
    const avgPopularity =
      cluster.signals.reduce((a, s) => a + s.signal.score, 0) / cluster.signals.length;
    if (distinctSources < 2 && avgPopularity < 40) continue;

    const weightSum = cluster.signals.reduce((a, s) => a + s.source.weight, 0);
    const combinedText = cluster.signals.map((s) => `${s.signal.title}. ${s.signal.summary ?? ""}`).join(" ");
    const keywords = extractKeywords(combinedText, 8);
    const ageHours = 0; // signals are fresh this cycle; refined when merged below

    const scores = scoreTopic({
      popularity: avgPopularity,
      sourceCount: distinctSources,
      ageHours,
      weightSum,
      keywordSpecificity: keywords.length,
    });

    // Merge into an existing recent topic if the title is similar, else create.
    const recent = await prisma.trendTopic.findMany({
      where: { createdAt: { gte: new Date(now - 1000 * 60 * 60 * 24) } },
      select: { id: true, title: true, slug: true },
      take: 200,
    });
    const match = recent.find((t) => similarity(t.title, cluster.title) > SIMILARITY_THRESHOLD);

    const topic = match
      ? await prisma.trendTopic.update({
          where: { id: match.id },
          data: {
            sourceCount: distinctSources,
            keywords,
            ...scores,
            updatedAt: new Date(),
          },
        })
      : await prisma.trendTopic.create({
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

    // Persist the raw signals linked to this topic.
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
  }

  await prisma.jobLog.create({
    data: { job: "trend-cycle", status: "ok", meta: { topics: topicCount, signals: items.length } },
  });

  return { topics: topicCount, signals: items.length };
}

/** Pick the top N ranked topics that don't yet have an article. */
export async function selectTopTopics(limit: number) {
  return prisma.trendTopic.findMany({
    where: { status: "RANKED", articles: { none: {} } },
    orderBy: { finalScore: "desc" },
    take: limit,
  });
}

export { slug };
