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

function queryFor(category: string, keywords: string[]): string {
  const c = (category || "").toLowerCase();
  for (const k of Object.keys(CATEGORY_QUERY)) if (c.includes(k)) return CATEGORY_QUERY[k];
  // fall back to the strongest keyword, else a generic news image
  return keywords[0] || "newspaper headlines";
}

/**
 * Fetch a real, relevant landscape HD photo from Pexels (free). Returns the
 * image URL (+ photographer attribution) or null if no key / no result.
 * Never throws — images are nice-to-have, not load-bearing.
 */
export async function fetchArticleImage(
  category: string,
  keywords: string[],
): Promise<{ url: string; credit: string } | null> {
  if (!env.PEXELS_API_KEY) return null;
  const query = queryFor(category, keywords);
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: env.PEXELS_API_KEY } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      photos?: { src?: { large2x?: string; large?: string }; photographer?: string }[];
    };
    const photos = data.photos ?? [];
    if (photos.length === 0) return null;
    // pick a random one of the top results so articles in a section vary
    const p = photos[Math.floor(Math.random() * Math.min(photos.length, 10))];
    const url = p?.src?.large2x || p?.src?.large;
    if (!url) return null;
    return { url, credit: `Photo: ${p.photographer ?? "Pexels"} / Pexels` };
  } catch {
    return null;
  }
}
