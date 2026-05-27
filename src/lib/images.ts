import { env } from "./env";

// Map a category to a reliable, relevant stock-photo search so every section
// gets a real, on-topic HD image (not AI-generated).
const CATEGORY_QUERY: Record<string, string> = {
  cricket: "cricket stadium india",
  ipl: "cricket stadium",
  markets: "stock market trading screen",
  business: "business meeting india",
  startups: "startup office team",
  tech: "technology computer",
  ai: "artificial intelligence circuit",
  entertainment: "bollywood cinema",
  india: "india city",
};

// Short topical anchor appended to a keyword so the photo stays ON-TOPIC while
// the keyword keeps it varied per article (e.g. "Rajat Patidar" + "cricket").
const CATEGORY_HINT: Record<string, string> = {
  cricket: "cricket",
  ipl: "cricket",
  markets: "stock market",
  business: "business",
  startups: "startup business",
  tech: "technology",
  ai: "artificial intelligence",
  entertainment: "bollywood",
  india: "india",
};

function lookup(map: Record<string, string>, category: string): string | null {
  const c = (category || "").toLowerCase();
  for (const k of Object.keys(map)) if (c.includes(k)) return map[k];
  return null;
}

// Ordered candidate queries, MOST SPECIFIC + ON-TOPIC first. Anchoring the
// strongest keyword to the category hint ("<keyword> <hint>") keeps the image
// relevant to the story while varying it per article (fixes both off-topic AND
// duplicate images). Broader category/generic queries are fallbacks.
function candidateQueries(category: string, keywords: string[]): string[] {
  const kw = keywords.map((k) => k.trim()).filter(Boolean);
  const hint = lookup(CATEGORY_HINT, category);
  const out: string[] = [];
  if (kw[0] && hint) out.push(`${kw[0]} ${hint}`); // on-topic + varied
  if (kw.length >= 2) out.push(kw.slice(0, 2).join(" "));
  if (kw[0]) out.push(kw[0]);
  const cq = lookup(CATEGORY_QUERY, category);
  if (cq) out.push(cq); // relevant generic fallback
  out.push(`india ${(category || "news").toLowerCase()}`);
  return [...new Set(out)];
}

export interface ArticleImage {
  url: string;
  credit: string;
}

const POOL = 20; // random pick from the top-N results so articles vary

async function searchPexels(query: string): Promise<ArticleImage | null> {
  if (!env.PEXELS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape`,
      { headers: { Authorization: env.PEXELS_API_KEY } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      photos?: { src?: { large2x?: string; large?: string }; photographer?: string }[];
    };
    const photos = data.photos ?? [];
    if (!photos.length) return null;
    const p = photos[Math.floor(Math.random() * Math.min(photos.length, POOL))];
    const url = p?.src?.large2x || p?.src?.large;
    return url ? { url, credit: `Photo: ${p.photographer ?? "Pexels"} / Pexels` } : null;
  } catch {
    return null;
  }
}

async function searchPixabay(query: string): Promise<ArticleImage | null> {
  if (!env.PIXABAY_API_KEY) return null;
  try {
    const res = await fetch(
      `https://pixabay.com/api/?key=${env.PIXABAY_API_KEY}&q=${encodeURIComponent(
        query,
      )}&image_type=photo&orientation=horizontal&per_page=30&safesearch=true`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      hits?: { largeImageURL?: string; webformatURL?: string; user?: string }[];
    };
    const hits = data.hits ?? [];
    if (!hits.length) return null;
    const h = hits[Math.floor(Math.random() * Math.min(hits.length, POOL))];
    const url = h?.largeImageURL || h?.webformatURL;
    return url ? { url, credit: `Photo: ${h.user ?? "Pixabay"} / Pixabay` } : null;
  } catch {
    return null;
  }
}

/**
 * Fetch a real, relevant landscape HD photo. Tries each candidate query
 * (most specific/on-topic first) across the configured providers (Pexels +
 * Pixabay if keyed), in randomised order for extra variety. Returns the first
 * hit or null. Never throws — images are nice-to-have, not load-bearing.
 */
export async function fetchArticleImage(
  category: string,
  keywords: string[],
): Promise<ArticleImage | null> {
  const providers = [searchPexels, searchPixabay];
  if (Math.random() < 0.5) providers.reverse(); // vary which source wins
  for (const query of candidateQueries(category, keywords)) {
    for (const provider of providers) {
      const img = await provider(query);
      if (img) return img;
    }
  }
  return null;
}
