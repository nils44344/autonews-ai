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

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

// Wikimedia Commons — real, FREELY-LICENSED photos of named entities (cricketers,
// companies, people, places). Commons hosts only free/public-domain media, so it's
// legal to use WITH attribution (which we store + display). Great for trust:
// actual player/company photos instead of generic stock. No API key needed.
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Joined adjacent keyword pairs ("shubman","gill" → "shubmangill"). These are
// highly specific to real multi-word names, so requiring one in a Commons file
// title gives accurate player matches with ~zero collisions (noise pairs like
// "sensexnifty" or "awfiscoworking" never appear in any file title → stock).
function joinedNamePairs(kw: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < Math.min(kw.length - 1, 3); i++) out.push(norm(kw[i] + kw[i + 1]));
  return out.filter((s) => s.length >= 8);
}

// `mustInclude` lists the entity name token(s) the matched file's title MUST
// contain (any one of them) — the relevance gate that stops Commons returning a
// loosely-related-but-wrong image (e.g. a Polish academy for "Awfis"). If nothing
// genuinely matches the entity, we return null and the caller falls back to stock.
async function searchWikimedia(query: string, mustInclude: string[]): Promise<ArticleImage | null> {
  const needs = mustInclude.map(norm).filter((n) => n.length >= 4);
  if (!query || !needs.length) return null;
  try {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=12` +
      `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1200`;
    const res = await fetch(url, { headers: { "user-agent": "AutoNewsAI/1.0 (autonews-ai.live)" } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            title?: string;
            imageinfo?: { thumburl?: string; url?: string; extmetadata?: Record<string, { value?: string }> }[];
          }
        >;
      };
    };
    const pages = data.query?.pages;
    if (!pages) return null;
    // Real raster photo AND the filename must reference the entity.
    const usable = Object.values(pages).filter((p) => {
      const u = (p.imageinfo?.[0]?.url ?? "").toLowerCase();
      const raster = /\.(jpg|jpeg|png)$/.test(u);
      const t = norm(p.title ?? "");
      const titleMatches = needs.some((n) => t.includes(n));
      return raster && titleMatches;
    });
    if (!usable.length) return null;
    const p = usable[Math.floor(Math.random() * Math.min(usable.length, 4))];
    const ii = p.imageinfo![0];
    const meta = ii.extmetadata ?? {};
    const src = ii.thumburl || ii.url;
    if (!src) return null;
    const artist = stripHtml(meta.Artist?.value ?? "") || "Wikimedia Commons";
    const license = stripHtml(meta.LicenseShortName?.value ?? "") || "CC";
    return { url: src, credit: `${artist} / Wikimedia Commons (${license})` };
  } catch {
    return null;
  }
}

/**
 * Fetch a real, relevant HD photo. First tries Wikimedia Commons for the named
 * entity (real player/company photo, free + attributed); falls back to Pexels/
 * Pixabay stock (category-anchored) otherwise. Returns {url, credit} or null.
 * Never throws — images are nice-to-have, not load-bearing.
 */
export async function fetchArticleImage(
  category: string,
  keywords: string[],
): Promise<ArticleImage | null> {
  const kw = keywords.map((k) => k.trim()).filter(Boolean);

  // 1. Real entity photo from Wikimedia — ONLY for Cricket, where the entity is
  //    a well-known player/team whose name reliably matches a real Commons photo.
  //    Elsewhere (companies, markets) name collisions produce wrong images
  //    (e.g. "Awfis" → a Polish sports academy), so we stick to safe stock.
  const c = (category || "").toLowerCase();
  if (c.includes("cricket") && kw.length) {
    const pairs = joinedNamePairs(kw);
    if (pairs.length) {
      for (const q of [kw.slice(0, 3).join(" "), kw.slice(0, 2).join(" ")].filter(Boolean)) {
        const w = await searchWikimedia(q, pairs);
        if (w) return w;
      }
    }
  }

  // 2. Stock fallback — category-anchored, randomised provider order.
  const providers = [searchPexels, searchPixabay];
  if (Math.random() < 0.5) providers.reverse();
  for (const query of candidateQueries(category, keywords)) {
    for (const provider of providers) {
      const img = await provider(query);
      if (img) return img;
    }
  }
  return null;
}
