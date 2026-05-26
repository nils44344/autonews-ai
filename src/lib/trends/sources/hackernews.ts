import type { RawSignal, SourceDef, SourceFetcher } from "../types";

// Hacker News Firebase API — free, no key. Great for tech/AI/startup signals.
interface HNItem {
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
  time?: number;
  type?: string;
}

export const hackernewsFetcher: SourceFetcher = {
  type: "HACKERNEWS",
  async fetch(def: SourceDef): Promise<RawSignal[]> {
    const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (!idsRes.ok) throw new Error(`HN topstories ${idsRes.status}`);
    const ids = ((await idsRes.json()) as number[]).slice(0, 30);

    const items = await Promise.all(
      ids.map(async (id) => {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return r.ok ? ((await r.json()) as HNItem) : null;
      }),
    );

    return items
      .filter((i): i is HNItem => !!i?.title && i.type === "story")
      .map((i) => {
        const engagement = Math.log10(1 + (i.score || 0) + (i.descendants || 0) * 2) * 22;
        return {
          title: i.title!.trim(),
          url: i.url,
          score: Math.min(100, engagement),
          category: def.category || "tech",
          raw: { points: i.score, comments: i.descendants },
        } satisfies RawSignal;
      });
  },
};
