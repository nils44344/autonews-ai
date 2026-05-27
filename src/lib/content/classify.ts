// Content-based category classification. The trend engine tags a topic with its
// SOURCE feed's category, which frequently mislabels (e.g. a GST/Supreme-Court
// story arriving from a "tech" feed → "Technology"). This re-derives the section
// from the title so stories land where they belong. Order = priority.
const RULES: { slug: string; name: string; re: RegExp }[] = [
  {
    slug: "cricket",
    name: "Cricket",
    re: /\b(cricket|ipl|odi|t20i?|test match|wicket|batsman|bowler|ranji|bcci|world cup|all-?rounder|run chase|stumps)\b/i,
  },
  {
    slug: "entertainment",
    name: "Entertainment",
    re: /\b(bollywood|box office|ott|web series|movie|film|actor|actress|trailer|netflix|cinema|celebrity|song|teaser)\b/i,
  },
  {
    slug: "markets",
    name: "Markets",
    re: /\b(sensex|nifty|stock market|stocks?|shares?|ipo|ofs|greenshoe|subscribed|oversubscribed|listing|gmp|bse|nse|rupee|dalal street|market cap|bonds?)\b/i,
  },
  {
    slug: "ai",
    name: "AI",
    re: /\b(a\.?i\.?|artificial intelligence|chatgpt|gemini|llm|openai|anthropic|machine learning|generative|copilot|deepseek|chatbot)\b/i,
  },
  {
    slug: "startups",
    name: "Startups",
    re: /\b(startup|funding|raises?|raised|seed round|series [a-f]\b|venture capital|\bvc\b|valuation|unicorn|pre-?seed|angel round|incubator)\b/i,
  },
  {
    slug: "business",
    name: "Business",
    re: /\b(gst|tax|supreme court|high court|\brbi\b|\bsebi\b|policy|ruling|verdict|parliament|ministry|regulation|tariff|budget|economy|earnings|profit|revenue|merger|acquisition|layoffs?|results|fiscal|crore|export|import)\b/i,
  },
  {
    slug: "tech",
    name: "Technology",
    re: /\b(smartphone|gadget|\bapp\b|software|\bchip\b|semiconductor|5g|laptop|device|cyber|hacking|data breach|gaming|android|\bios\b|operating system)\b/i,
  },
];

export function classifyCategory(title: string): { slug: string; name: string } | null {
  const t = title || "";
  for (const r of RULES) if (r.re.test(t)) return { slug: r.slug, name: r.name };
  return null;
}
