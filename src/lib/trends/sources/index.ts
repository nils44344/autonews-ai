import type { SourceType } from "@prisma/client";
import type { SourceFetcher } from "../types";
import { googleTrendsFetcher } from "./google-trends";
import { hackernewsFetcher } from "./hackernews";
import { newsapiFetcher } from "./newsapi";
import { redditFetcher } from "./reddit";
import { rssFetcher } from "./rss";
import { youtubeFetcher } from "./youtube";

// Google News is just RSS under the hood.
const fetchers: Record<SourceType, SourceFetcher> = {
  RSS: rssFetcher,
  GOOGLE_NEWS: { ...rssFetcher, type: "GOOGLE_NEWS" },
  REDDIT: redditFetcher,
  HACKERNEWS: hackernewsFetcher,
  GOOGLE_TRENDS: googleTrendsFetcher,
  NEWSAPI: newsapiFetcher,
  YOUTUBE: youtubeFetcher,
  X: {
    // X/Twitter requires a paid bearer token; left as a guarded no-op so the
    // pipeline never crashes when it isn't configured.
    type: "X",
    async fetch() {
      return [];
    },
  },
};

export function getFetcher(type: SourceType): SourceFetcher {
  return fetchers[type];
}

export { googleNewsUrl } from "./rss";
