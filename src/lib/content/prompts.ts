// Prompt builders for the content engine. Kept separate so they can be tuned /
// A-B tested without touching pipeline code.

export const HOUSE_STYLE = `You are a senior journalist and SEO editor for a reputable digital newsroom.
Write in clear, engaging, human English. Vary sentence length. Be specific and factual.
Never invent statistics, quotes, or events. If a detail is uncertain, attribute it
("according to reports") or omit it. Avoid AI clichés ("in the ever-evolving world of",
"dive into", "in conclusion"). No hype, no filler. Use active voice.`;

export interface ArticleBrief {
  title: string;
  keywords: string[];
  category: string;
  context: string; // aggregated source snippets
  minWords: number;
  maxWords: number;
  type: "NEWS" | "BLOG";
  angle?: string; // for blog: the specific cluster angle
}

export function newsArticlePrompt(b: ArticleBrief): string {
  return `Write a ${b.type === "NEWS" ? "news article" : "blog post"} about: "${b.title}".
Category: ${b.category}. Target length: ${b.minWords}-${b.maxWords} words.
Primary keywords to target naturally (do NOT keyword-stuff): ${b.keywords.join(", ")}.
${b.angle ? `Specific angle/thesis: ${b.angle}` : ""}

Source context gathered from public feeds (use for facts, summarise in your own words,
do NOT copy):
"""
${b.context.slice(0, 4000)}
"""

Structure the body in Markdown with:
- An engaging opening that front-loads the key fact (inverted pyramid for news).
- 3-6 H2/H3 subheadings using natural long-tail phrasings.
- Short paragraphs (2-4 sentences). Optionally one bulleted list where it helps scanning.
- A concise "Key takeaways" section near the end for featured-snippet capture.

Return ONLY JSON with this exact shape:
{
  "title": "compelling, accurate headline (<=70 chars)",
  "dek": "one-sentence standfirst",
  "body": "full article in Markdown",
  "excerpt": "2-sentence summary",
  "seoTitle": "<=60 chars, includes main keyword",
  "seoDescription": "<=155 chars meta description",
  "keywords": ["6-10 keywords incl long-tail"],
  "faq": [{"question":"...","answer":"..."}],   // 3-5 Q&A targeting People-Also-Ask
  "sources": [{"title":"...","url":"..."}]        // cite the input sources you used
}`;
}

export function blogClusterPrompt(pillarTitle: string, category: string): string {
  return `The newsroom just covered the news topic: "${pillarTitle}" (category: ${category}).
Propose a topic cluster of 4 supporting blog posts that build SEO authority around it.
Mix these intents: explainer, comparison, prediction/analysis, how-to/guide.

Return ONLY JSON:
{
  "pillar": "the pillar/hub blog title summarising the theme",
  "posts": [
    {"title":"...", "intent":"explainer|comparison|prediction|howto", "angle":"one-line thesis", "keywords":["..."]}
  ]
}`;
}

export function memePrompt(title: string, category: string): string {
  return `A trending ${category} news item: "${title}".
Decide if it is meme-worthy (light, non-tragic, non-sensitive). If a topic involves death,
violence, disasters, hate, or protected groups, set "memeWorthy": false.

If meme-worthy, create ONE punchy meme in a classic TWO-LINE (top + bottom) format.
Pick a format from EXACTLY this list: "Drake", "This is Fine", "Bad Luck Brian",
"Ancient Aliens", "One Does Not Simply", "Futurama Fry", "Success Kid", "Grumpy Cat",
"Mocking Spongebob", "Doge".
Write it like a real meme: topText is the setup, bottomText is the punchline. Each line must be
SHORT and snappy (max ~45 characters), genuinely funny, and reference the actual story — not a
description of it. No hashtags inside topText/bottomText.

Return ONLY JSON:
{
  "memeWorthy": true|false,
  "reason": "why / why not",
  "format": "one format from the list above",
  "topText": "short setup line (REQUIRED, <=45 chars)",
  "bottomText": "short punchline (REQUIRED, <=45 chars)",
  "caption": "social post caption with 1-2 hashtags",
  "imagePrompt": "short text-to-image description (fallback only)"
}`;
}

export function qualityRubricPrompt(title: string, body: string): string {
  return `You are a ruthless newsroom QA editor. Evaluate this draft.
Title: ${title}
Body:
"""
${body.slice(0, 6000)}
"""

Score each 0-100 and return ONLY JSON:
{
  "originality": 0-100,        // feels fresh, not generic
  "readability": 0-100,        // clear, well structured
  "grammar": 0-100,
  "factualConsistency": 0-100, // internally consistent, no obvious fabrication
  "seo": 0-100,                // keyword use, headings, snippet-readiness
  "spamRisk": 0-100,           // 0 = clean, 100 = spammy/keyword-stuffed
  "issues": ["short list of concrete problems"],
  "verdict": "approve|revise|reject"
}`;
}
