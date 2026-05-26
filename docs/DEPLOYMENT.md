# Deployment Guide

## Option A — Single VPS with Docker (free-first MVP)

Target: one $5–10/mo VPS (Hetzner, DigitalOcean, Contabo). Runs db + redis + web +
worker. Ollama runs on the host for free generation.

```bash
# On the VPS (Ubuntu)
curl -fsSL https://get.docker.com | sh
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3.1

git clone <your repo> autonews && cd autonews
cp .env.example .env
# edit: ADMIN_TOKEN, SITE_URL=https://yourdomain.com, PUBLISH_MODE
docker compose up -d --build
```

The `web` service runs `prisma db push` + seed on first boot. Check health:

```bash
curl localhost:3000/api/health        # {"ok":true,"db":"up"}
docker compose logs -f worker         # watch the pipeline
```

### Put Cloudflare in front
1. Add the domain to Cloudflare, point an A record at the VPS IP.
2. Set SSL/TLS to **Full (strict)**; install origin cert or use Caddy/Nginx + Let's Encrypt.
3. Cache rule: cache HTML for the site (respect ISR `revalidate`); **bypass** `/admin` and `/api/*`.
4. Enable Brotli, HTTP/3, and "Always Use HTTPS".

### Reverse proxy (recommended) — Caddy example
```
yourdomain.com {
    reverse_proxy localhost:3000
}
```

## Option B — Managed / low-cost cloud

- **DB:** Neon or Supabase (serverless Postgres). Put the pooled URL in `DATABASE_URL`.
- **Redis:** Upstash. Put its URL in `REDIS_URL`.
- **Web:** Vercel/Render/Fly for the Next.js app.
- **Worker:** Render Background Worker / Fly Machine / Railway running `npm run worker:prod`
  (the worker **cannot** run on Vercel serverless — it's a long-lived process).
- **AI:** set `AI_PROVIDER=openai` + `OPENAI_API_KEY` (or Anthropic).

> The web app and worker must share the same `DATABASE_URL` and `REDIS_URL`.

## Database migrations

- Dev: `npm run db:push` (fast, no migration history) or `npm run db:migrate` (versioned).
- Prod: generate migrations locally with `prisma migrate dev`, commit `prisma/migrations`,
  and run `prisma migrate deploy` on release.

## First-run checklist
- [ ] `.env` has a strong `ADMIN_TOKEN` and correct `SITE_URL`.
- [ ] `/api/health` returns ok.
- [ ] Sign in at `/admin`, run a trend cycle, see topics populate.
- [ ] Approve a few articles; confirm they render with JSON-LD (test in Google's Rich Results Test).
- [ ] `/(sitemap.xml)` lists published URLs; submit to Google Search Console + Bing.

## Backups & ops
- `pg_dump` the Postgres volume on a cron; snapshot the VPS.
- Redis is a cache/queue — losing it drops in-flight jobs, not content. Schedules
  re-register on worker boot.
- Monitor `JobLog` (surfaced in the dashboard) and `/api/health`.
