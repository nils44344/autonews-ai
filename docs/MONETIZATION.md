# Monetization Architecture

The data models and hooks are in place; wiring each revenue stream is a small,
isolated change. Nothing here blocks the free MVP.

## 1. Display ads (AdSense / Ezoic / Mediavine)
- Add an `<AdSlot/>` client component and place it between article sections and in
  the sidebar. Lazy-load below the fold.
- Add a consent banner (CMP) for GDPR/CCPA before loading ad scripts.
- Record revenue into `DailyStat.adRevenueCents` (manual import or network API) — the
  dashboard already sums and displays it.

## 2. Affiliate marketing (model: `AffiliateLink`)
- Add links in the admin (network, target URL, trigger keywords).
- `injectAffiliateLinks` (in `seo/internal-links.ts`) auto-links the **first**
  occurrence of each keyword at publish time, with `rel="nofollow"`.
- Increment `AffiliateLink.clicks` from a redirect route (`/go/:id`) for attribution.

## 3. Newsletter (model: `NewsletterSubscriber`)
- Capture is live (`/api/newsletter`). Add double opt-in email (Resend/Listmonk) and
  a daily/weekly digest cron in the worker that pulls top published articles by views.
- Monetize via sponsorships or paid premium editions.

## 4. Sponsored posts (model: `SponsoredPost`)
- Create a sponsored article flagged to an advertiser + budget + flight dates.
- Render a clear "Sponsored" disclosure label (legal requirement).

## 5. Membership / paywall
- Add Stripe + a `Membership` model; gate premium analysis articles (`isPremium`
  flag on `Article`) and offer ad-free reading.
- Soft paywall (metered) tends to preserve SEO better than a hard wall.

## 6. Digital products
- Sell reports/ebooks compiled from your best evergreen clusters; deliver via Stripe
  + a download token.

## Revenue reporting
`DailyStat` aggregates page views, visitors, ad revenue, and affiliate revenue per
day. The admin dashboard reads it for the Revenue tile. Populate it from a nightly
worker job that rolls up `Article.views` and pulls ad-network/affiliate APIs.

## Sequencing (recommended)
Traffic first → newsletter capture → affiliate → display ads (needs traffic
thresholds) → sponsorships → membership/products.
