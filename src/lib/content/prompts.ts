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
  const isNews = b.type === "NEWS";
  return `Write a long, in-depth ${isNews ? "news article" : "blog post"} about: "${b.title}".
Category: ${b.category}. Primary keywords (use naturally, NEVER keyword-stuff): ${b.keywords.join(", ")}.
${b.angle ? `Specific angle/thesis to argue: ${b.angle}` : ""}

Source facts gathered from public feeds (use ONLY these for facts, summarise in your own
words, do NOT copy sentences, do NOT invent statistics/quotes/events beyond them):
"""
${b.context.slice(0, 4000)}
"""

LENGTH IS A HARD REQUIREMENT: the "body" field MUST be at least ${b.minWords} words
(aim for ${b.minWords}-${b.maxWords}). A shorter body is a FAILED response. Reach the
length with genuine depth and specifics — NOT repetition or filler. Do not stop writing
until every section below exists and the minimum is met.

Write the body in Markdown with these sections, each substantial (roughly 150-250 words):
${
  isNews
    ? `1. An opening paragraph with NO heading (do not write the word "Lead") — front-load the core fact (who / what / how much / when), inverted-pyramid style.
2. ## What happened — the specifics of the event/announcement.
3. ## Why it matters — significance and immediate implications.
4. ## The bigger picture — sector/market context in India, comparable trends or players.
5. ## What's next — what to watch, likely consequences, stated plans.
6. ## Key takeaways — 3-5 bullet points for featured-snippet capture.`
    : `1. An opening paragraph with NO heading (do not write the word "Hook") — draw the reader in with the problem or central question.
2. ## Background — the context a reader needs, explained plainly.
3. Two or three ## H2 sections that develop the thesis with specifics and examples.
4. ## Practical implications — what this means for the reader / what to do.
5. ## Key takeaways — 3-5 bullet points for featured-snippet capture.`
}

Use short paragraphs (2-4 sentences) and natural long-tail phrasings in the H2 headings.

Return ONLY JSON with this exact shape (no prose outside the JSON):
{
  "title": "compelling, accurate headline (<=70 chars)",
  "dek": "one-sentence standfirst",
  "body": "full article in Markdown, AT LEAST ${b.minWords} words, all sections above",
  "excerpt": "2-sentence summary",
  "seoTitle": "<=60 chars, includes main keyword",
  "seoDescription": "<=155 chars meta description",
  "keywords": ["6-10 keywords incl long-tail"],
  "faq": [{"question":"...","answer":"..."}],
  "sources": [{"title":"...","url":"..."}]
}`;
}

export function factCheckPrompt(b: ArticleBrief): string {
  return `Write a NEUTRAL, balanced fact-check / controversy analysis about: "${b.title}".
Category: Fact Check. Primary keywords (use naturally): ${b.keywords.join(", ")}.

Source facts gathered from public feeds — THIS IS YOUR ONLY EVIDENCE. Summarise in your
own words. Do NOT invent facts, quotes, numbers, dates, or rulings beyond what is here.
If the evidence is thin or contested, say so explicitly and rate accordingly:
"""
${b.context.slice(0, 4000)}
"""

You are an impartial fact-checker. Rules:
- Take NO side. Present what each side claims, then weigh it against the evidence/rules above.
- Never state a disputed thing as settled fact. Attribute claims ("according to…", "critics say…").
- If the evidence doesn't conclusively settle the claim, the rating MUST be "Unproven" or "Disputed".
- Pick the rating ONLY from this list: True, Mostly True, Mixed, Misleading, Mostly False, False, Unproven, Disputed.

Body length ${b.minWords}-${b.maxWords} words (HARD minimum ${b.minWords}). Markdown sections,
each substantial:
1. An opening paragraph (NO heading) that states plainly what the controversy is and the specific claim in dispute.
2. ## What actually happened — the established, undisputed facts from the evidence.
3. ## The claim being checked — state the exact claim, and who is making it.
4. ## What each side says — present both/all positions fairly, attributed.
5. ## What the evidence and rules show — weigh it; cite the relevant rule/precedent if given.
6. ## The verdict — a measured, neutral conclusion (no cheerleading, no outrage).
7. ## Key takeaways — 3-5 neutral bullet points.

Return ONLY JSON with this exact shape:
{
  "title": "neutral, search-friendly headline (<=70 chars), e.g. 'Was X out? The controversy, explained'",
  "dek": "one-sentence neutral standfirst",
  "body": "full article in Markdown, all sections above, >= ${b.minWords} words",
  "excerpt": "2-sentence neutral summary",
  "seoTitle": "<=60 chars incl main keyword",
  "seoDescription": "<=155 chars",
  "keywords": ["6-10 keywords incl 'fact check', the names involved, long-tail"],
  "faq": [{"question":"...","answer":"..."}],
  "sources": [{"title":"...","url":"..."}],
  "claimReviewed": "the single specific claim assessed, as a short statement",
  "rating": "one of: True | Mostly True | Mixed | Misleading | Mostly False | False | Unproven | Disputed",
  "verdict": "one neutral sentence stating the conclusion and why"
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
