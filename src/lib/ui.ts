// Visual styling per category. The articles have no images (AI text), so color
// keyed to category is what gives the site hierarchy and life. Full literal
// Tailwind class strings so they survive purge (src/lib is in the content glob).

export interface CategoryStyle {
  badge: string; // badge background + text
  dot: string; // small accent dot bg
  gradient: string; // from/to for hero + card strips
  ring: string; // hover border color
}

const PALETTES: Record<string, CategoryStyle> = {
  technology: { badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500", gradient: "from-blue-500 to-indigo-600", ring: "hover:border-blue-400" },
  ai: { badge: "bg-violet-50 text-violet-700", dot: "bg-violet-500", gradient: "from-violet-500 to-fuchsia-600", ring: "hover:border-violet-400" },
  business: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", gradient: "from-emerald-500 to-teal-600", ring: "hover:border-emerald-400" },
  startups: { badge: "bg-orange-50 text-orange-700", dot: "bg-orange-500", gradient: "from-orange-500 to-pink-600", ring: "hover:border-orange-400" },
  markets: { badge: "bg-green-50 text-green-700", dot: "bg-green-500", gradient: "from-green-500 to-emerald-600", ring: "hover:border-green-400" },
  india: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500", gradient: "from-rose-500 to-orange-500", ring: "hover:border-rose-400" },
  cricket: { badge: "bg-lime-50 text-lime-700", dot: "bg-lime-500", gradient: "from-lime-500 to-green-600", ring: "hover:border-lime-400" },
  crypto: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500", gradient: "from-amber-500 to-orange-600", ring: "hover:border-amber-400" },
  finance: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500", gradient: "from-emerald-500 to-green-600", ring: "hover:border-emerald-400" },
  sports: { badge: "bg-rose-50 text-rose-700", dot: "bg-rose-500", gradient: "from-rose-500 to-red-600", ring: "hover:border-rose-400" },
  entertainment: { badge: "bg-pink-50 text-pink-700", dot: "bg-pink-500", gradient: "from-pink-500 to-rose-600", ring: "hover:border-pink-400" },
  science: { badge: "bg-cyan-50 text-cyan-700", dot: "bg-cyan-500", gradient: "from-cyan-500 to-sky-600", ring: "hover:border-cyan-400" },
  health: { badge: "bg-green-50 text-green-700", dot: "bg-green-500", gradient: "from-green-500 to-emerald-600", ring: "hover:border-green-400" },
  world: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-500", gradient: "from-slate-600 to-slate-800", ring: "hover:border-slate-400" },
  politics: { badge: "bg-red-50 text-red-700", dot: "bg-red-500", gradient: "from-red-500 to-rose-700", ring: "hover:border-red-400" },
};

const FALLBACKS: CategoryStyle[] = [
  { badge: "bg-indigo-50 text-indigo-700", dot: "bg-indigo-500", gradient: "from-indigo-500 to-blue-600", ring: "hover:border-indigo-400" },
  { badge: "bg-teal-50 text-teal-700", dot: "bg-teal-500", gradient: "from-teal-500 to-cyan-600", ring: "hover:border-teal-400" },
  { badge: "bg-orange-50 text-orange-700", dot: "bg-orange-500", gradient: "from-orange-500 to-amber-600", ring: "hover:border-orange-400" },
  { badge: "bg-fuchsia-50 text-fuchsia-700", dot: "bg-fuchsia-500", gradient: "from-fuchsia-500 to-purple-600", ring: "hover:border-fuchsia-400" },
];

// ── Memes ────────────────────────────────────────────────────────────────────
// Render real classic-meme images via memegen.link (free, no API key). Map the
// AI's free-text "format" to a verified memegen template id; fall back to drake.
// ONLY 2-line (top/bottom) templates — the AI gives a topText + bottomText, so
// multi-panel templates (expanding brain = 4 lines, distracted boyfriend = 3)
// rendered half-empty/broken. These are all verified `lines: 2` on memegen.
const MEME_POOL = [
  "drake",
  "buzz",
  "aag",
  "blb",
  "cheems",
  "fry",
  "mordor",
  "success",
  "philosoraptor",
  "grumpycat",
  "spongebob",
  "fine",
  "doge",
  "oprah",
  "leo",
  "morpheus",
  "disastergirl",
  "yodawg",
];

// Honour a specific named format when the AI picks a 2-line one we recognise.
const MEME_FORMAT_MAP: Record<string, string> = {
  drake: "drake",
  drakeposting: "drake",
  "this is fine": "fine",
  doge: "doge",
  "success kid": "success",
  "one does not simply": "mordor",
  mordor: "mordor",
  "ancient aliens": "aag",
  "bad luck brian": "blb",
  philosoraptor: "philosoraptor",
  "futurama fry": "fry",
  "not sure if": "fry",
  "grumpy cat": "grumpycat",
  "mocking spongebob": "spongebob",
  "disaster girl": "disastergirl",
  oprah: "oprah",
  buzz: "buzz",
};

function memeTemplate(format: string | null | undefined, seed: string): string {
  const k = (format || "").toLowerCase().trim();
  if (MEME_FORMAT_MAP[k]) return MEME_FORMAT_MAP[k];
  for (const key of Object.keys(MEME_FORMAT_MAP)) if (k.includes(key)) return MEME_FORMAT_MAP[key];
  // Unknown / multi-panel format → deterministically pick a 2-line template from
  // the pool (stable per meme, varied across memes).
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return MEME_POOL[h % MEME_POOL.length];
}

function encodeMemeText(s?: string | null): string {
  const t = (s || "").trim();
  if (!t) return "_";
  const escaped = t
    .replace(/_/g, "__")
    .replace(/-/g, "--")
    .replace(/ /g, "_")
    .replace(/\?/g, "~q")
    .replace(/&/g, "~a")
    .replace(/%/g, "~p")
    .replace(/#/g, "~h")
    .replace(/\//g, "~s")
    .replace(/"/g, "''");
  return encodeURIComponent(escaped).replace(/%7E/g, "~");
}

export function memeImageUrl(
  format: string | null | undefined,
  top: string | null | undefined,
  bottom: string | null | undefined,
): string {
  const seed = `${top ?? ""}|${bottom ?? ""}`;
  return `https://api.memegen.link/images/${memeTemplate(format, seed)}/${encodeMemeText(top)}/${encodeMemeText(bottom)}.png`;
}

export function categoryStyle(name?: string | null): CategoryStyle {
  if (!name) return FALLBACKS[0];
  const key = name.toLowerCase();
  for (const k of Object.keys(PALETTES)) {
    if (key.includes(k)) return PALETTES[k];
  }
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACKS[hash % FALLBACKS.length];
}
