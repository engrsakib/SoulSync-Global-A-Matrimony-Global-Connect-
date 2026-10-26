# Subscription pricing (`/subscribe`)

Public marketing route for **Spark / Velocity / Nexus** plans with **monthly** (30-day) and **yearly** (365-day) access. Home **Platform insights** remains at [`/#stats`](../apps/web/components/biodata-stats-section.tsx); site nav **Subscribe** links here.

## Data model

Prisma ([`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma)):

- `SubscriptionPlan` — SKU (`slug`, `tier`, `interval`, `priceCents` **offer**, `compareAtPriceCents` **regular/list**, `validityDays`, `features` JSON, `isFeatured`, `status`)
- `SubscriptionCoupon` — `code`, percent or fixed discount, optional tier/interval scope, redemption limits
- `SubscriptionCheckoutIntent` — stub checkout (auth required); `metadata` stores price snapshot (`compareAtPriceCents`, `validityDays`, discounted offer)

Seed: [`packages/db/src/seed-subscription-plans.ts`](../packages/db/src/seed-subscription-plans.ts) (6 SKUs + `WELCOME30`, `VELOCITY10`; legacy `GOLD10` deactivated). Page copy: [`packages/db/data/subscription-catalog-page.json`](../packages/db/data/subscription-catalog-page.json). Seed also writes SSR fallback [`subscription-catalog-fallback.json`](../packages/db/data/subscription-catalog-fallback.json) (used when API/Redis return no plans).

Migration: `20261026170000_spark_velocity_nexus_pricing` remaps tier enum and adds compare-at + validity columns.

Types: [`packages/shared-types/src/subscription-catalog.ts`](../packages/shared-types/src/subscription-catalog.ts).

## Local empty catalog

If `/subscribe` shows “Plans are being configured”, run:

```bash
pnpm --filter @soulsync/db db:deploy
pnpm --filter @soulsync/db db:seed
```

Clear Redis key `subscription:catalog:v1` if a stale empty catalog was cached. Web and API **ignore** cached catalogs with `plans: []` and refetch from the API/DB instead.

## Redis

| Key | TTL | Layer |
| --- | --- | ----- |
| `subscription:catalog:v1` | 3600 s | API (primary) + web write-through on SSR miss ([`apps/web/lib/subscription/`](../apps/web/lib/subscription/)) |

Admin plan/coupon mutations bust API cache via `SubscriptionsService.invalidateCatalogCache()`. Checkout intent creation does **not** invalidate catalog.

## API (Nest `/v1`)

| Method | Path | Auth |
| ------ | ---- | ---- |
| GET | `/subscriptions/catalog` | Public |
| POST | `/subscriptions/coupons/validate` | Public |
| POST | `/subscriptions/checkout-intents` | JWT |
| GET/POST/PATCH/DELETE | `/admin/subscription-plans` | `SUPER_ADMIN` |
| GET/POST/PATCH | `/admin/subscription-coupons` | `SUPER_ADMIN` |

Module: [`apps/api/src/subscriptions/`](../apps/api/src/subscriptions/). Seed super admin: `super@soulsync.local` (see db seed).

## Web

- SSR: [`getSubscriptionCatalog()`](../apps/web/lib/subscription/get-catalog.ts) → Redis → API.
- Page: [`apps/web/app/(public)/subscribe/page.tsx`](../apps/web/app/(public)/subscribe/page.tsx).
- UI: [`apps/web/components/subscribe/`](../apps/web/components/subscribe/) — offer vs strikethrough regular, validity line, **Most Popular** on Velocity (`isFeatured`), check-only feature bullets, coupon on offer price.
- BFF: [`apps/web/app/api/public/subscriptions/`](../apps/web/app/api/public/subscriptions/), [`checkout-intents`](../apps/web/app/api/subscriptions/checkout-intents/route.ts).

Login redirect: `?next=/subscribe` or `returnUrl` ([`auth-success.ts`](../apps/web/lib/auth-success.ts)).

## Out of scope (v1)

Stripe/webhooks, dashboard admin UI, live payment capture, enforcing biodata/DM limits in product logic (pricing copy only).
