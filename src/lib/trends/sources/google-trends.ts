import googleTrends from "google-trends-api";
import type { RawSignal, SourceDef, SourceFetcher } from "../types";

// Google Trends "daily trending searches" — no API key. `def.url` carries the
// geo code (e.g. "US", "GB", "IN"); defaults to US.
interface TrendingDay {
  trendingSearchesDays: {
    trendingSearches: {
      title: { query: string };
      formattedTraffic: string;
      articles: { title: string; url: string }[];
    }[];
  }[];
}

function parseTraffic(formatted: string): number {
  // "200K+" -> 200000, "2M+" -> 2_000_000
  const m = formatted.replace(/[+,\s]/g, "").match(/([\d.]+)([KM]?)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const mult = m[2]?.toUpperCase() === "M" ? 1e6 : m[2]?.toUpperCase() === "K" ? 1e3 : 1;
  return n * mult;
}

export const googleTrendsFetcher: SourceFetcher = {
  type: "GOOGLE_TRENDS",
  async fetch(def: SourceDef): Promise<RawSignal[]> {
    const geo = def.url || "US";
    const raw = await googleTrends.dailyTrends({ geo });
    const data = JSON.parse(raw) as TrendingDay;
    const days = data.trendingSearchesDays?.[0]?.trendingSearches || [];
    const maxTraffic = Math.max(1, ...days.map((d) => parseTraffic(d.formattedTraffic)));

    return days.map((d) => {
      const traffic = parseTraffic(d.formattedTraffic);
      return {
        title: d.title.query,
        url: d.articles?.[0]?.url,
        summary: d.articles?.[0]?.title,
        // Normalise search volume to 0-100 within the day's range.
        score: Math.min(100, (traffic / maxTraffic) * 100),
        category: def.category,
        raw: { traffic, articles: d.articles?.slice(0, 3) },
      } satisfies RawSignal;
    });
  },
};
