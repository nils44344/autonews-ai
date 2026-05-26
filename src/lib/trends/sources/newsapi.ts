import { env } from "../../env";
import type { RawSignal, SourceDef, SourceFetcher } from "../types";

// NewsAPI.org — optional, free tier. Disabled automatically when no key is set.
interface NewsApiResponse {
  status: string;
  articles: {
    title: string;
    url: string;
    description?: string;
    publishedAt: string;
    source: { name: string };
  }[];
}

export const newsapiFetcher: SourceFetcher = {
  type: "NEWSAPI",
  async fetch(def: SourceDef): Promise<RawSignal[]> {
    if (!env.NEWSAPI_KEY) return [];
    // def.url can be a category (business, technology, sports...) or a query.
    const param = def.url?.includes(" ")
      ? `q=${encodeURIComponent(def.url)}`
      : `category=${def.url || "general"}`;
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?${param}&language=en&pageSize=40`,
      { headers: { "X-Api-Key": env.NEWSAPI_KEY } },
    );
    if (!res.ok) throw new Error(`NewsAPI ${res.status}`);
    const json = (await res.json()) as NewsApiResponse;
    const now = Date.now();

    return json.articles
      .filter((a) => a.title && a.title !== "[Removed]")
      .map((a) => {
        const ageHours = (now - new Date(a.publishedAt).getTime()) / 3.6e6;
        const recency = Math.max(0, 1 - ageHours / 24);
        return {
          title: a.title.trim(),
          url: a.url,
          summary: a.description?.slice(0, 500),
          score: 30 + recency * 70,
          category: def.category,
          raw: { source: a.source.name, publishedAt: a.publishedAt },
        } satisfies RawSignal;
      });
  },
};
