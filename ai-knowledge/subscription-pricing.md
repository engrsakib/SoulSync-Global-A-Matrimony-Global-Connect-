# Subscription pricing (`/subscribe`)

Public marketing route for **Silver / Gold / Platinum** plans with **monthly** and **yearly** billing. Home **Platform insights** remains at [`/#stats`](../apps/web/components/biodata-stats-section.tsx); site nav **Subscribe** links here.

## Data model

Prisma ([`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma)):

- `SubscriptionPlan` — SKU (`slug`, `tier`, `interval`, `priceCents`, `features` JSON, `isFeatured`, `status`)
- `SubscriptionCoupon` — `code`, percent or fixed discount, optional tier/interval scope, redemption limits
- `SubscriptionCheckoutIntent` — stub checkout (auth required); `metadata` stores price snapshot

Seed: [`packages/db/src/seed-subscription-plans.ts`](../packages/db/src/seed-subscription-plans.ts) (6 plans + `WELCOME30`, `GOLD10`). Page copy: [`packages/db/data/subscription-catalog-page.json`](../packages/db/data/subscription-catalog-page.json).

Types: [`packages/shared-types/src/subscription-catalog.ts`](../packages/shared-types/src/subscription-catalog.ts).

## Redis

| Key | TTL | Layer |
| --- | --- | ----- |
| `subscription:catalog:v1` | 3600 s | API (primary) + web write-through on SSR miss ([`apps/web/lib/subscription/`](../apps/web/lib/subscription/)) |

Admin mutations bust API cache via `SubscriptionsService.invalidateCatalogCache()`.

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
- UI: [`apps/web/components/subscribe/`](../apps/web/components/subscribe/) — theme tokens, featured Gold card, coupon panel, login-gated checkout stub → [`/subscribe/thank-you`](../apps/web/app/(public)/subscribe/thank-you/page.tsx).
- BFF: [`apps/web/app/api/public/subscriptions/`](../apps/web/app/api/public/subscriptions/), [`checkout-intents`](../apps/web/app/api/subscriptions/checkout-intents/route.ts).

Login redirect: `?next=/subscribe` or `returnUrl` ([`auth-success.ts`](../apps/web/lib/auth-success.ts)).

## Out of scope (v1)

Stripe/webhooks, dashboard admin UI, live payment capture.
