# Development Roadmap

A phased, ship-as-you-go plan. Phases 0–3 are the **free MVP** (already scaffolded
in this repo). Phases 4+ are scaling and growth.

## Phase 0 — Foundations (done in this repo)
- [x] Monorepo-free Next.js + worker codebase, TypeScript strict.
- [x] Prisma schema: sources, signals, topics, articles, memes, monetization, ops.
- [x] Env validation, Docker Compose (db + redis + web + worker).
- [x] Free source seed (RSS, Reddit, HN, Google Trends/News).

## Phase 1 — Trend detection (done)
- [x] Source fetchers (key-free first).
- [x] Clustering + transparent scoring + ranking.
- [x] Admin source-monitoring panel + manual "run cycle now".
- [ ] Add embeddings-based dedup (pgvector) when volume grows.

## Phase 2 — Content generation (done)
- [x] AI provider abstraction (Ollama default).
- [x] News writer with length tiers + structured SEO JSON.
- [x] Blog topic-cluster generator with internal cross-linking.
- [x] Meme generator with safety gate.
- [ ] Image generation for memes + OG images (SDXL/Flux locally, or DALL·E/Ideogram).

## Phase 3 — Quality, SEO & publishing (done)
- [x] Quality engine (LLM rubric + heuristics + dedup).
- [x] Safety/spam filters.
- [x] JSON-LD (NewsArticle/BlogPosting/FAQ/Breadcrumb), dynamic sitemap + robots.
- [x] Manual review queue + auto-publish mode.
- [ ] Programmatic IndexNow / Google Indexing API ping on publish.

## Phase 4 — Growth & distribution
- [ ] Newsletter sending (Resend/Listmonk) with double opt-in + digest cron.
- [ ] Auto social syndication (X, Threads, LinkedIn, Telegram) on publish.
- [ ] Category & tag landing pages + author/topic hub pages for SEO depth.
- [ ] RSS/JSON feeds out; web push notifications for breaking news.
- [ ] A/B test headlines; track CTR; feed winners back into prompts.

## Phase 5 — Monetization
- [ ] AdSense / Ezoic slots + consent management (GDPR/CCPA).
- [ ] Affiliate dashboard + click attribution (model already present).
- [ ] Membership/paywall (Stripe) for premium analysis + ad-free.
- [ ] Sponsored post workflow + disclosure labels.

## Phase 6 — Scale & reliability
- [ ] Horizontal worker scaling; queue sharding by category.
- [ ] Read replicas + Redis cluster; CDN edge caching (Cloudflare).
- [ ] Observability: Prometheus/Grafana, Sentry, structured logs (job log already seeds this).
- [ ] Cost controls: per-provider budgets, model routing (cheap draft → strong edit).
- [ ] Editorial guardrails: fact-check pass, correction workflow, source allowlist.

## Suggested first week
1. `docker compose up` → confirm site + admin load.
2. Pull a good Ollama model (`llama3.1` or `qwen2.5:14b`) and run a cycle.
3. Tune scoring weights + `MIN_QUALITY_SCORE` against real output.
4. Curate sources for your niche; disable noisy ones in the dashboard.
5. Keep `PUBLISH_MODE=manual`; approve ~20 articles to calibrate quality.
6. Point a domain via Cloudflare; submit sitemap to Google Search Console.
