# Public system policy pages (`@soulsync/web` + `@soulsync/api`)

Legal/trust markdown pages under **`/system/[slug]`** in the public layout (site header + footer).

## Routes

| Slug | URL |
| ---- | --- |
| `terms` | `/system/terms` |
| `privacy-policy` | `/system/privacy-policy` |
| `safety` | `/system/safety` |
| `return-refund` | `/system/return-refund` |

Permanent redirects in [`apps/web/next.config.ts`](../apps/web/next.config.ts): `/system/terms-condition`, `/system/sefety` → normalized slugs. Avoid case-only redirect sources (e.g. `PRIVACY-policy` → `privacy-policy`): Next can match case-insensitively on Windows and loop on the canonical URL.

Footer **Useful links** point to these routes.

## Data model

Prisma [`SystemPage`](../packages/db/prisma/schema.prisma): `slug` (unique), `title`, `markdown` (`Text`), `sortOrder`, optional `sidebar` JSON (highlight cards), `updatedAt`.

Seed: markdown in [`packages/db/data/system-pages/`](../packages/db/data/system-pages/), upsert via [`packages/db/src/seed-system-pages.ts`](../packages/db/src/seed-system-pages.ts) from [`db:seed`](../packages/db/package.json).

**Required once per environment:** `pnpm --filter @soulsync/db db:deploy` then `pnpm --filter @soulsync/db db:seed`. Without the `system_pages` table, the API returns 500 and the web route calls `notFound()` → **404** on `/system/*`. API and web dev servers must be running (`NEXT_PUBLIC_API_URL` defaults to `http://localhost:4000/v1`).

## API (Nest)

- `GET /v1/public/system-pages` — ordered index
- `GET /v1/public/system-pages/:slug` — full page DTO with `prevSlug` / `nextSlug`

DTOs: [`packages/shared-types/src/system-page.ts`](../packages/shared-types/src/system-page.ts).

**Redis cache:** TTL **86400** s; keys `system:page:v1:{slug}`, index `system:pages:v1:index`. Lock keys `system:page:lock:v1:{slug}` / `system:pages:lock:v1:index` (EX **30** s). Loader: [`apps/api/src/redis/redis-cached-json.ts`](../apps/api/src/redis/redis-cached-json.ts) — single DB read on expiry, waiters poll up to ~5 s.

Module: [`apps/api/src/system-pages/`](../apps/api/src/system-pages/).

## Web

- SSR: [`getSystemPage()`](../apps/web/lib/system-pages/get-page.ts) → Nest API, React `cache()`.
- BFF: `GET /api/public/system-pages/[slug]` (s-maxage 300).
- UI: split markdown + sidebar cards — [`apps/web/components/system/`](../apps/web/components/system/) (`react-markdown`, `remark-gfm`).
