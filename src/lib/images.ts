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

function categoryQuery(category: string): string | null {
  const c = (category || "").toLowerCase();
  for (const k of Object.keys(CATEGORY_QUERY)) if (c.includes(k)) return CATEGORY_QUERY[k];
  return null;
}

// Ordered candidate queries, MOST SPECIFIC first. Using each article's own
// keywords (which differ per article) is what stops two stories in the same
// section getting the identical stock photo. Category + generic are fallbacks
// for when the keywords are too obscure for Pexels to match.
function candidateQueries(category: string, keywords: string[]): string[] {
  const kw = keywords.map((k) => k.trim()).filter(Boolean);
  const out: string[] = [];
  if (kw.length) out.push(kw.slice(0, 2).join(" ")); // 2 strongest keywords
  if (kw.length) out.push(kw[0]); // single strongest keyword
  const cq = categoryQuery(category);
  if (cq) out.push(cq);
  out.push(`india ${(category || "news").toLowerCase()}`);
  return [...new Set(out)];
}

/**
 * Fetch a real, relevant landscape HD photo from Pexels (free). Tries the
 * article's specific keywords first (so same-section articles don't share an
 * image), falling back to a category/generic query. Picks randomly from a wide
 * result pool. Returns the image URL (+ attribution) or null. Never throws.
 */
export async function fetchArticleImage(
  category: string,
  keywords: string[],
): Promise<{ url: string; credit: string } | null> {
  if (!env.PEXELS_API_KEY) return null;
  for (const query of candidateQueries(category, keywords)) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape`,
        { headers: { Authorization: env.PEXELS_API_KEY } },
      );
      if (!res.ok) continue;
      const data = (await res.json()) as {
        photos?: { src?: { large2x?: string; large?: string }; photographer?: string }[];
      };
      const photos = data.photos ?? [];
      if (photos.length === 0) continue; // try the next, broader query
      // random pick from a wide pool so articles vary even on the same query
      const p = photos[Math.floor(Math.random() * Math.min(photos.length, 20))];
      const url = p?.src?.large2x || p?.src?.large;
      if (url) return { url, credit: `Photo: ${p.photographer ?? "Pexels"} / Pexels` };
    } catch {
      /* try the next query */
    }
  }
  return null;
}
