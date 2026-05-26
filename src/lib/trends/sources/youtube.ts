import { env } from "../../env";
import type { RawSignal, SourceDef, SourceFetcher } from "../types";

// YouTube Data API v3 "mostPopular" — optional. Disabled without a key.
interface YTResponse {
  items: {
    snippet: { title: string; categoryId: string };
    statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
    id: string;
  }[];
}

export const youtubeFetcher: SourceFetcher = {
  type: "YOUTUBE",
  async fetch(def: SourceDef): Promise<RawSignal[]> {
    if (!env.YOUTUBE_API_KEY) return [];
    const region = def.url || "US";
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&maxResults=30&regionCode=${region}&key=${env.YOUTUBE_API_KEY}`,
    );
    if (!res.ok) throw new Error(`YouTube ${res.status}`);
    const json = (await res.json()) as YTResponse;
    const maxViews = Math.max(
      1,
      ...json.items.map((i) => Number(i.statistics.viewCount || 0)),
    );

    return json.items.map((i) => {
      const views = Number(i.statistics.viewCount || 0);
      return {
        title: i.snippet.title.trim(),
        url: `https://youtube.com/watch?v=${i.id}`,
        score: Math.min(100, (views / maxViews) * 100),
        category: def.category || "entertainment",
        raw: i.statistics,
      } satisfies RawSignal;
    });
  },
};
