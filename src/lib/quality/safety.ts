// Rule-based safety + spam filtering. Runs independently of (and as a backstop
// to) the LLM's own judgement, so a jailbroken/erratic model can't push unsafe
// content straight to publish.

const BLOCK_TERMS = [
  // tragedy / sensitive — never meme-ify
  "death", "died", "killed", "killing", "murder", "suicide", "shooting",
  "massacre", "terror", "bombing", "war crime", "genocide", "rape", "assault",
  "disaster", "earthquake", "famine", "outbreak", "pandemic deaths",
  // hate / harassment
  "slur", "nazi", "ethnic cleansing",
];

const SPAM_SIGNALS = [
  /(.)\1{6,}/, // long char repeats
  /(buy now|click here|limited offer|act now){2,}/i,
  /https?:\/\/\S+(\s+https?:\/\/\S+){5,}/, // link farm
];

export interface SafetyReport {
  score: number; // 0-100, higher = safer
  blocked: string[];
  spam: boolean;
  notes: string[];
}

export function checkMemeSafety(text: string): SafetyReport {
  const lower = text.toLowerCase();
  const blocked = BLOCK_TERMS.filter((t) => lower.includes(t));
  const spam = SPAM_SIGNALS.some((re) => re.test(text));
  let score = 100;
  score -= blocked.length * 40;
  if (spam) score -= 50;
  return {
    score: Math.max(0, Math.min(100, score)),
    blocked,
    spam,
    notes: blocked.length ? [`sensitive terms: ${blocked.join(", ")}`] : [],
  };
}

/** Spam / keyword-stuffing heuristic for articles (0 = clean, 100 = spammy). */
export function spamScore(body: string, keywords: string[]): number {
  const words = (body.toLowerCase().match(/[\p{L}']+/gu) || []);
  if (words.length === 0) return 100;
  let maxDensity = 0;
  for (const kw of keywords) {
    const k = kw.toLowerCase();
    const count = words.filter((w) => w === k).length;
    maxDensity = Math.max(maxDensity, count / words.length);
  }
  // >3.5% density on any single keyword reads as stuffing.
  const densityPenalty = Math.min(70, Math.max(0, (maxDensity - 0.035) * 2000));
  const patternPenalty = SPAM_SIGNALS.some((re) => re.test(body)) ? 30 : 0;
  return Math.min(100, densityPenalty + patternPenalty);
}
