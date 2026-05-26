# Architecture

## Processes

AutoNews AI runs as **two processes** sharing one codebase and database:

1. **Web (`next start`)** — public site, admin dashboard, API routes. Stateless,
   horizontally scalable behind a CDN.
2. **Worker (`worker/index.ts`)** — BullMQ consumers + cron scheduler. This is the
   automation brain; runs trend detection, generation, QA, and publishing.

Postgres (state) and Redis (queue + cache) back both.

## Folder map

```
prisma/schema.prisma        Data model (sources, topics, articles, memes, monetization, ops)
prisma/seed.ts              Default free sources + categories

src/lib/
  env.ts                    Validated env (zod) — single source of truth
  db.ts                     Prisma singleton
  utils.ts                  slug, similarity (clustering), keyword extraction, reading time
  markdown.ts               XSS-safe markdown → HTML
  auth.ts                   Admin cookie / bearer auth (constant-time)
  ai/                       Provider abstraction: ollama | openai | anthropic + JSON parsing
  trends/
    sources/                One fetcher per source type (rss, reddit, hackernews, gtrends, …)
    scoring.ts              Transparent 0-100 sub-scores → blended finalScore
    engine.ts               collect → cluster → score → persist ranked topics
  content/
    prompts.ts              House style + prompt builders (tunable, A/B-able)
    schemas.ts              zod schemas validating model JSON output
    news-writer.ts          Topic → news article (length by type)
    blog-generator.ts       Pillar article → 4-post topic cluster, cross-linked
    meme-generator.ts       Topic → meme concept + image prompt, safety-gated
  quality/
    index.ts                LLM rubric blended with deterministic heuristics
    safety.ts               Rule-based spam + meme safety filters
  seo/
    schema.ts               JSON-LD: NewsArticle, BlogPosting, FAQ, Breadcrumb, Org
    internal-links.ts       Related-article linking + affiliate injection
  publish/index.ts          Quality gate + manual/auto routing + canonicalisation
  queue/                    Redis connection, queue defs, enqueue helpers

worker/
  index.ts                  Instantiates one Worker per queue + logging + graceful shutdown
  processors.ts             Job handlers wiring the pipeline (fan-out logic lives here)
  scheduler.ts              Repeatable cron jobs (trend cycle, publish sweep)

src/app/
  page.tsx                  Home (top story, trending, latest, newsletter)
  article/[slug]            News detail (+ JSON-LD, FAQ, sources, related)
  blog, blog/[slug]         Blog index + detail
  memes                     Meme gallery
  sitemap.ts, robots.ts     Dynamic SEO endpoints
  admin/                    Control room (stats, review queue, topics, sources, job log)
  api/                      health, newsletter, admin (login/trigger/article)
```

## Scoring model (`trends/scoring.ts`)

Each topic gets four explainable 0–100 sub-scores:

- **viralScore** — source popularity amplified by cross-source corroboration and source weight.
- **freshnessScore** — exponential decay (~36h half-life style).
- **seoScore** — long-tail specificity + volume; rewards rankable phrasings.
- **competitionScore** — proxy where multi-source niche topics > crowded broad topics.

`finalScore = 0.34·viral + 0.28·seo + 0.20·freshness + 0.18·competition (+8 if breaking)`.

Weights are constants in one file so ranking stays transparent and tunable.

## Why this clustering

Headlines about the same event arrive worded differently across sources. We
normalize (lowercase, strip stopwords/punctuation) and use **Jaccard similarity**
over word sets — dependency-free and good enough to merge "OpenAI launches GPT-6"
with "GPT-6 released by OpenAI". For enterprise scale, swap in embeddings + a vector
index (pgvector) behind the same `clusterSignals` interface.

## Extending

- **New source:** implement `SourceFetcher` in `trends/sources/`, register it in
  `sources/index.ts`, add a row via the seed or admin. The engine handles the rest.
- **New AI provider:** implement `LLMProvider`, wire it in `ai/index.ts`.
- **New content type:** add a prompt + schema + generator + a queue + processor.
