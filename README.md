# AutoNews AI

A fully automated, SEO-focused AI news platform. It detects trending topics from
many public sources, writes original SEO-optimized news + blog content, generates
memes for meme-worthy topics, runs quality/safety gates, and publishes — either
fully automatically or behind a human-approval queue.

**Free-first:** the entire MVP runs with **zero paid API keys** using a local
[Ollama](https://ollama.com) model plus key-free sources (RSS, Reddit, Hacker News,
Google Trends, Google News). Swap in OpenAI/Anthropic with a single env var when you
want higher quality.

---

## Architecture at a glance

```
                         ┌──────────────────────────────────────────────┐
                         │                  WORKER (BullMQ)              │
  Public sources ──┐     │                                              │
  RSS / Reddit /   │     │  trend ─▶ article ─▶ quality ─▶ publish      │
  HN / GTrends /   ├────▶│                  │                           │
  NewsAPI / YT     │     │                  ├─▶ blog cluster ─▶ quality │
                   │     │                  └─▶ meme (safety-gated)     │
                   │     └──────────────────────────────────────────────┘
                   │                    │                  │
                   ▼                    ▼                  ▼
            ┌────────────┐      ┌──────────────┐   ┌──────────────┐
            │  Postgres  │◀────▶│   Next.js    │   │    Redis     │
            │  (Prisma)  │      │ web + admin  │   │ queue/cache  │
            └────────────┘      └──────────────┘   └──────────────┘
```

- **`src/lib/trends`** — source fetchers, clustering, scoring (viral / SEO / freshness / competition).
- **`src/lib/ai`** — provider abstraction over Ollama, OpenAI, Anthropic.
- **`src/lib/content`** — news writer, blog-cluster generator, meme generator + prompts.
- **`src/lib/quality`** — LLM rubric blended with deterministic heuristics + safety filter.
- **`src/lib/seo`** — JSON-LD schema, internal linking, affiliate injection (+ `app/sitemap.ts`, `app/robots.ts`).
- **`src/lib/queue` / `worker/`** — BullMQ queues, processors, and the cron scheduler.
- **`src/app`** — public site (home, article, blog, memes) + `/admin` control room + API routes.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full component breakdown and
[`docs/ROADMAP.md`](docs/ROADMAP.md) for the development plan.

---

## Quick start (Docker — recommended)

Prereqs: Docker, and Ollama running on the host with a model pulled.

```bash
# 1. Pull a local model (free)
ollama pull llama3.1

# 2. Configure
cp .env.example .env
#    edit ADMIN_TOKEN at minimum

# 3. Boot everything (db migrates + seeds automatically on first run)
docker compose up -d --build

# 4. Open the site and the dashboard
#    http://localhost:3000          (site)
#    http://localhost:3000/admin    (sign in with ADMIN_TOKEN)
#    Click "Run trend cycle now" to generate the first batch.
```

## Quick start (local, no Docker)

Prereqs: Node 20+, a Postgres instance, a Redis instance, and Ollama.

```bash
npm install
cp .env.example .env            # set DATABASE_URL, REDIS_URL, ADMIN_TOKEN
npm run db:push                 # create tables
npm run db:seed                 # seed sources + categories

# terminal 1 — web
npm run dev

# terminal 2 — background worker (trend cycles, generation, publishing)
npm run worker

# OR run a single synchronous pipeline pass (no Redis needed):
npm run trends:once
```

---

## Configuration

Everything is driven by `.env` (validated in `src/lib/env.ts`). Key switches:

| Variable | What it does |
|---|---|
| `AI_PROVIDER` | `ollama` (free/local), `openai`, or `anthropic` |
| `PUBLISH_MODE` | `manual` (review queue) or `auto` (publish on passing QA) |
| `MIN_QUALITY_SCORE` | 0–100 gate; articles below are rejected |
| `TOPICS_PER_CYCLE` | how many top topics become articles each cycle |
| `TREND_INTERVAL_MIN` | trend-detection cadence |

Optional source keys (`NEWSAPI_KEY`, `YOUTUBE_API_KEY`, `X_BEARER_TOKEN`) activate
those sources automatically when present; everything else works without keys.

---

## How content flows

1. **Trend cycle** fetches every enabled source, normalizes signals, clusters
   near-duplicate headlines, and scores each topic (viral, SEO opportunity,
   freshness, competition → blended `finalScore`).
2. Top `TOPICS_PER_CYCLE` ranked topics fan out into **article** + **meme** jobs.
3. The **news writer** picks length by topic type (breaking 800–1200, major
   1500–2500, evergreen 2000–4000), generates structured JSON (title, body, SEO
   meta, FAQ, citations), and saves a draft.
4. The **quality engine** scores it (LLM rubric + length/structure/spam/dedup
   heuristics). Passing news articles also trigger a **blog topic cluster**.
5. **Publish** injects affiliate + internal links, sets canonical URL, and either
   publishes (auto) or routes to the **review queue** (manual).
6. **Memes** are generated only for non-sensitive topics and pass a rule-based
   safety filter before reaching the review queue.

---

## Monetization (architecture-ready)

Models and hooks exist for AdSense slots, `NewsletterSubscriber` (with double-opt-in
hook), `AffiliateLink` auto-injection by keyword, `SponsoredPost`, premium membership,
and digital products. See [`docs/MONETIZATION.md`](docs/MONETIZATION.md).

---

## Scaling tiers

- **Free MVP:** single VPS, Ollama, Postgres + Redis in Docker. ~$5–10/mo VPS.
- **Low-cost:** managed Postgres (Neon/Supabase) + Upstash Redis + OpenAI `gpt-4o-mini`
  + Cloudflare CDN in front. Horizontal worker scaling via BullMQ.
- **Enterprise:** read-replicas, queue sharding by category, image generation
  service for memes/OG images, vector dedup, multi-region edge caching.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## Security

Input validation (zod) at all boundaries, XSS-safe markdown rendering (escape-first),
constant-time admin auth, security headers, `rel="nofollow noopener"` on external
links, robots-disallowed admin/api, and a defense-in-depth meme safety filter.
See [`docs/SECURITY.md`](docs/SECURITY.md).

---

## Editorial & legal note

Automated journalism still needs a human accountable for what publishes. Keep
`PUBLISH_MODE=manual` until you trust your prompts and sources, always preserve
source citations, and review meme output. You are responsible for the content your
deployment publishes.
