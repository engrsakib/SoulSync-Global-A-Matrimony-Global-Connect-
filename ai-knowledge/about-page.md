# Public About page (`@soulsync/web`)

Dedicated marketing route **`/about`** (public `(public)` layout: site header + footer). Home page keeps the short founder block at `/#about`; nav **About** links to `/about`.

## Content

- **Seed:** [`apps/web/data/about-page.seed.json`](../apps/web/data/about-page.seed.json) — hero, goal, mission, policies (one `featured` for data security), founder, six team members, trust pillars, SEO.
- **Types:** [`packages/shared-types/src/about-page.ts`](../packages/shared-types/src/about-page.ts) — `AboutPageContentDto`, `isAboutPageContentDto`.
- **Loader:** [`apps/web/lib/about-page/get-content.ts`](../apps/web/lib/about-page/get-content.ts) — `getAboutPageContent()` for RSC pages.

## Redis cache

| Key                | TTL    | Notes                                                                                           |
| ------------------ | ------ | ----------------------------------------------------------------------------------------------- |
| `about:content:v1` | 3600 s | Full JSON blob; shared client [`apps/web/lib/redis/client.ts`](../apps/web/lib/redis/client.ts) |

Read order: Redis → seed import → write-through to Redis on miss. Without `REDIS_URL`, seed is used every request (no throw).

Future admin: persist to DB, call `setAboutPageContent()` (same key), optional CDN purge.

## API

- `GET /api/public/about-page` — same payload as SSR (Cache-Control `s-maxage=300`).

## UI components

Reusable: [`apps/web/components/public/`](../apps/web/components/public/) (`PublicSectionShell`, `PublicSectionHeader`, `PublicBokehBackground`).

About sections: [`apps/web/components/about/`](../apps/web/components/about/) — all server components; team flip uses CSS `group-hover` + `motion-safe` fallback.

Team demo photos: [`apps/web/public/team/`](../apps/web/public/team/) (Unsplash; credits in seed `photoCredit`).

## Theming

Uses CSS variables and brand tokens like other marketing sections ([`themes.md`](themes.md), [`faq-section.tsx`](../apps/web/components/faq-section.tsx)).
