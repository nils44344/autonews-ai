import slugify from "slugify";

export function slug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true }).slice(0, 80);
}

/** Append a short random suffix to keep slugs unique. */
export function uniqueSlug(input: string): string {
  return `${slug(input)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) || []).length;
}

/** ~220 wpm average reading speed. */
export function readingMinutes(text: string): number {
  return Math.max(1, Math.round(wordCount(text) / 220));
}

/** Normalise a headline so near-duplicate topics cluster together. */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\b(the|a|an|of|to|in|on|for|and|is|are|was|were|says|after|amid)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Jaccard similarity over word sets — cheap, dependency-free clustering. */
export function similarity(a: string, b: string): number {
  const sa = new Set(normalizeTitle(a).split(" ").filter((w) => w.length > 2));
  const sb = new Set(normalizeTitle(b).split(" ").filter((w) => w.length > 2));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / (sa.size + sb.size - inter);
}

/** Extract candidate keywords (naive TF over non-stopwords). */
const STOP = new Set(
  "the a an of to in on for and or but is are was were be been being this that these those with as at by from it its their his her our your my we you they i he she them us has have had will would could should can may might do does did not no".split(
    " ",
  ),
);

export function extractKeywords(text: string, max = 8): string[] {
  const freq = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[\p{L}][\p{L}\p{N}'-]+/gu) || []) {
    if (raw.length < 3 || STOP.has(raw)) continue;
    freq.set(raw, (freq.get(raw) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
