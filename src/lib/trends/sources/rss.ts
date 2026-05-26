import Parser from "rss-parser";
import type { RawSignal, SourceDef, SourceFetcher } from "../types";

const parser = new Parser({ timeout: 15000 });

// Generic RSS/Atom fetcher. Works for tech blogs, business, sports,
// entertainment, crypto, AI newsletters, and Google News RSS queries.
export const rssFetcher: SourceFetcher = {
  type: "RSS",
  async fetch(def: SourceDef): Promise<RawSignal[]> {
    if (!def.url) return [];
    const feed = await parser.parseURL(def.url);
    const now = Date.now();

    return (feed.items || []).slice(0, 40).map((item) => {
      const published = item.isoDate ? new Date(item.isoDate).getTime() : now;
      const ageHours = Math.max(0, (now - published) / 3.6e6);
      // Recency-weighted base score: fresh items score higher.
      const recency = Math.max(0, 1 - ageHours / 48); // decays over 2 days
      return {
        title: (item.title || "").trim(),
        url: item.link,
        summary: (item.contentSnippet || item.content || "").slice(0, 500),
        score: 20 + recency * 80,
        category: def.category,
        raw: { published: item.isoDate, creator: item.creator },
      } satisfies RawSignal;
    }).filter((s) => s.title.length > 8);
  },
};

/** Build a Google News RSS feed url for a query or topic. */
export function googleNewsUrl(query: string, lang = "en-US", country = "US"): string {
  const q = encodeURIComponent(query);
  return `https://news.google.com/rss/search?q=${q}&hl=${lang}&gl=${country}&ceid=${country}:en`;
}
