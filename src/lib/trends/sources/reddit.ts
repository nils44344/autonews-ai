import { env } from "../../env";
import type { RawSignal, SourceDef, SourceFetcher } from "../types";

// Reddit's public JSON endpoints require no API key. `def.url` is the subreddit
// name (e.g. "technology") or a full listing path.
interface RedditChild {
  data: {
    title: string;
    permalink: string;
    url: string;
    ups: number;
    num_comments: number;
    created_utc: number;
    over_18: boolean;
    stickied: boolean;
  };
}

export const redditFetcher: SourceFetcher = {
  type: "REDDIT",
  async fetch(def: SourceDef): Promise<RawSignal[]> {
    const sub = (def.url || "all").replace(/^\/?r\//, "");
    const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=40`, {
      headers: { "User-Agent": env.REDDIT_USER_AGENT },
    });
    if (!res.ok) throw new Error(`Reddit ${sub} ${res.status}`);
    const json = (await res.json()) as { data: { children: RedditChild[] } };

    return json.data.children
      .map((c) => c.data)
      .filter((p) => !p.stickied && !p.over_18 && p.title)
      .map((p) => {
        // Score blends upvotes + comments (engagement), log-scaled.
        const engagement = Math.log10(1 + p.ups + p.num_comments * 2) * 20;
        return {
          title: p.title.trim(),
          url: `https://reddit.com${p.permalink}`,
          summary: undefined,
          score: Math.min(100, engagement),
          category: def.category,
          raw: { ups: p.ups, comments: p.num_comments, link: p.url },
        } satisfies RawSignal;
      });
  },
};
