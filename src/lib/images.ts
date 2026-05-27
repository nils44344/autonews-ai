import { env } from "./env";

// Category → a relevant, high-quality stock-photo search. Cricket uses
// "cricket player" so we get player action/silhouette shots (not stadiums/logos).
const CATEGORY_QUERY: Record<string, string> = {
  cricket: "cricket player",
  ipl: "cricket player",
  markets: "stock market trading",
  business: "business office meeting",
  startups: "startup team office",
  tech: "technology",
  ai: "artificial intelligence",
  entertainment: "cinema film",
  finance: "finance money",
  health: "healthcare hospital",
  science: "science laboratory",
  world: "world city skyline",
  politics: "government building",
  india: "india city",
};

function categoryQuery(category: string): string {
  const c = (category || "").toLowerCase();
  for (const k of Object.keys(CATEGORY_QUERY)) if (c.includes(k)) return CATEGORY_QUERY[k];
  return `${c || "india"} news`;
}

// Topic-relevant stock queries keyed off the article TITLE — so a coal story
// gets mining, a court/GST story gets law/gavel, etc. (much better than a
// generic category image). Curated terms only (all return clean stock), checked
// before the category fallback. Order = priority.
const TOPIC_HINTS: [RegExp, string][] = [
  [/\bcoal|mining|\bmines?\b/i, "coal mine industry"],
  [/\bgst|tax|supreme court|high court|verdict|ruling|\bcourt\b|lawsuit|\blegal\b|petition/i, "courthouse law gavel"],
  [/gaming|gamer|esports|online game/i, "online gaming controller"],
  [/electric vehicle|\bev\b|e-?scooter|electric scooter|electric car/i, "electric vehicle charging"],
  [/\boil\b|petrol|diesel|crude|refinery|natural gas/i, "oil refinery industry"],
  [/\bbank\b|banking|\bloan|\bupi\b|payment|fintech|lending/i, "bank finance building"],
  [/airline|aviation|\bflight|airport|aircraft/i, "airplane airport"],
  [/real estate|property market|housing|realty/i, "real estate buildings"],
  [/crypto|bitcoin|blockchain|ethereum/i, "cryptocurrency coins"],
  [/pharma|\bdrug\b|medicine|vaccine|hospital|healthcare|hospital/i, "pharmaceutical laboratory"],
  [/telecom|\b5g\b|\bjio\b|airtel|vodafone|spectrum/i, "telecom tower network"],
  [/semiconductor|\bchips?\b/i, "semiconductor chip"],
  [/solar|renewable|wind energy|green energy|clean energy/i, "solar panels renewable energy"],
  [/automobile|\bcar maker|\bsuv\b|maruti|tata motors|\bauto sales/i, "automobile car factory"],
  [/\bipo\b|\bofs\b|offer for sale|greenshoe|oversubscribed/i, "stock market trading"],
];

export function imageQueryFor(category: string, title: string): string {
  const t = title || "";
  for (const [re, q] of TOPIC_HINTS) if (re.test(t)) return q;
  return categoryQuery(category);
}

export interface ArticleImage {
  url: string;
  credit: string;
}

// Fetch up to `pages` of results for a query from Pexels, returning every
// distinct HD url with attribution. Used to build a per-category pool.
async function pexelsPage(query: string, page: number): Promise<ArticleImage[]> {
  if (!env.PEXELS_API_KEY) return [];
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=80&page=${page}&orientation=landscape`,
      { headers: { Authorization: env.PEXELS_API_KEY } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      photos?: { src?: { large2x?: string; large?: string }; photographer?: string }[];
    };
    return (data.photos ?? [])
      .map((p) => {
        const url = p.src?.large2x || p.src?.large;
        return url ? { url, credit: `Photo: ${p.photographer ?? "Pexels"} / Pexels` } : null;
      })
      .filter((x): x is ArticleImage => x !== null);
  } catch {
    return [];
  }
}

async function pixabayPage(query: string, page: number): Promise<ArticleImage[]> {
  if (!env.PIXABAY_API_KEY) return [];
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${env.PIXABAY_API_KEY}&q=${encodeURIComponent(
        query,
      )}&image_type=photo&orientation=horizontal&per_page=80&page=${page}&safesearch=true`,
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      hits?: { largeImageURL?: string; webformatURL?: string; user?: string }[];
    };
    return (data.hits ?? [])
      .map((h) => {
        const url = h.largeImageURL || h.webformatURL;
        return url ? { url, credit: `Photo: ${h.user ?? "Pixabay"} / Pixabay` } : null;
      })
      .filter((x): x is ArticleImage => x !== null);
  } catch {
    return [];
  }
}

/**
 * Build a pool of distinct, relevant HD images for a category — enough to give
 * every article a UNIQUE image. Paginates Pexels (+ Pixabay if keyed). The
 * backfill uses this to de-duplicate across all posts.
 */
export async function fetchImagePool(query: string, minCount: number): Promise<ArticleImage[]> {
  const seen = new Set<string>();
  const pool: ArticleImage[] = [];
  for (let page = 1; page <= 5 && pool.length < minCount; page++) {
    const batch = [...(await pexelsPage(query, page)), ...(await pixabayPage(query, page))];
    if (!batch.length) break;
    for (const img of batch) if (!seen.has(img.url)) (seen.add(img.url), pool.push(img));
  }
  // shuffle so adjacent articles don't get visually similar consecutive results
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * Fetch one relevant HD image for an article, avoiding any url in `exclude`
 * (so a new post never reuses a recent post's image). Returns {url, credit} or
 * null. Never throws — images are nice-to-have, not load-bearing.
 */
export async function fetchArticleImage(
  category: string,
  title: string,
  exclude: Set<string> = new Set(),
): Promise<ArticleImage | null> {
  const query = imageQueryFor(category, title);
  for (let page = 1; page <= 5; page++) {
    const batch = [...(await pexelsPage(query, page)), ...(await pixabayPage(query, page))];
    if (!batch.length) break;
    const fresh = batch.filter((img) => !exclude.has(img.url));
    if (fresh.length) return fresh[Math.floor(Math.random() * fresh.length)];
  }
  return null;
}
