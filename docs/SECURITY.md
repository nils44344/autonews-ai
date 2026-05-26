# Security Implementation

## What's built in

| Area | Control | Where |
|---|---|---|
| Input validation | All external input parsed with **zod** | `api/*`, `lib/env.ts`, `content/schemas.ts` |
| XSS | Markdown rendered **escape-first**; only a controlled tag set is emitted; link hrefs restricted to `http(s)` | `lib/markdown.ts` |
| AuthN (admin) | httpOnly cookie or `Bearer` token, **constant-time** compare | `lib/auth.ts` |
| AuthZ | Every admin API route calls `authorizeRequest`; admin page gates on `isAdmin` | `api/admin/*`, `admin/page.tsx` |
| Headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` | `next.config.mjs` |
| Crawl hygiene | `/admin` and `/api/*` disallowed in robots | `app/robots.ts` |
| SEO/link safety | External links get `rel="nofollow noopener" target="_blank"` | `lib/markdown.ts`, article pages |
| Content safety | Rule-based meme safety + spam/keyword-stuffing filter, independent of the LLM | `lib/quality/safety.ts` |
| Secrets | Never committed; `.env` git-ignored; validated at boot | `.gitignore`, `lib/env.ts` |
| Prisma | Parameterized queries via Prisma Client (no string-built SQL) | everywhere |

## Hardening checklist for production

- [ ] Replace the shared `ADMIN_TOKEN` with real accounts (`AdminUser` model exists)
      using hashed passwords (argon2/bcrypt) + sessions; add rate-limiting on login.
- [ ] Add a Content-Security-Policy header (script-src 'self' + your analytics/ads;
      note inline JSON-LD uses `<script type="application/ld+json">` which CSP allows
      via `'self'` is not enough — use a nonce or hash for the LD blocks).
- [ ] Rate-limit public endpoints (`/api/newsletter`) — e.g. Upstash Ratelimit or a
      Redis token bucket — to stop signup abuse.
- [ ] Double opt-in for newsletter (the upsert hook is in place; wire the email send).
- [ ] Run the worker as a non-root user; drop container capabilities.
- [ ] Set `secure: true` cookies (already keyed off `NODE_ENV=production`) behind HTTPS.
- [ ] Egress allowlist for source fetchers if running in a locked-down network.
- [ ] Rotate provider API keys; set per-provider spend limits.
- [ ] Dependency scanning (`npm audit`, Dependabot) + image scanning (Trivy).

## Trust boundaries

- **Source content is untrusted.** It's only used as *context* for generation and is
  never rendered raw. Summaries shown in admin are escaped by React.
- **LLM output is semi-trusted.** It passes through zod schemas, the markdown escaper,
  the quality engine, and (for memes) the safety filter before it can reach readers.
- **Admin is the only privileged surface.** Keep it off public crawls and behind real
  auth before launch.

## Responsible automation

Keep `PUBLISH_MODE=manual` until quality is proven. Preserve citations, label
sponsored/affiliate content, and keep a human accountable for published output.
