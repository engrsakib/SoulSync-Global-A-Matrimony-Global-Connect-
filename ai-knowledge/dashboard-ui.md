# Dashboard UI

Logged-in area under [`apps/web/app/(dashboard)/dashboard/`](<../apps/web/app/(dashboard)/dashboard/>).

## Routes

Path constants: [`apps/web/lib/dashboard-routes.ts`](../apps/web/lib/dashboard-routes.ts).

| Path                  | Page                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `/dashboard`          | Redirects to `/dashboard/profile`                                  |
| `/dashboard/profile`  | My Profile — click avatar to open upload modal + information cards |
| `/dashboard/settings` | Editable account, email, username, password                        |
| `/dashboard/biodata`  | Section-based biodata builder (encrypted at rest on API)           |

## Biodata location (geo)

- **UI**: Location section uses cascading **country → state → city** selects, **mother tongue** from REST Countries languages, **postal code** with country-specific format hint/regex ([`biodata-builder.tsx`](../apps/web/components/dashboard/biodata-builder.tsx), hook [`use-geo-location.ts`](../apps/web/lib/geo/use-geo-location.ts)).
- **BFF**: [`apps/web/app/api/geo/`](../apps/web/app/api/geo/) proxies Nest (no REST Countries key in the browser).
- **API**: [`apps/api/src/geo/`](../apps/api/src/geo/) — REST Countries v5 (`REST_COUNTRIES_*` in [`apps/api/.env`](../apps/api/.env)) + `country-state-city` for states/cities. Routes under `GET /v1/geo/countries`.

Legacy URLs `/profile` and `/profile/settings` permanently redirect to the paths above ([`next.config.ts`](../apps/web/next.config.ts)).

Layout shell: [`dashboard-shell.tsx`](../apps/web/components/dashboard/dashboard-shell.tsx) — **desktop**: sticky sidebar (`h-screen`), scrollable nav, profile menu pinned at bottom, collapse chevron on the border (no footer collapse control). **Mobile**: full-screen bottom sheet ([`mobile-menu-sheet.tsx`](../apps/web/components/dashboard/mobile-menu-sheet.tsx)) slides up with backdrop, drag handle, Escape/backdrop dismiss, body scroll lock; same nav + profile footer as desktop.

## Brand

Forest green tokens live in [`packages/ui/src/styles.css`](../packages/ui/src/styles.css) (`--color-brand-*`, `--dashboard-header`). Shared button classes: [`apps/web/lib/ui-classes.ts`](../apps/web/lib/ui-classes.ts).

## Components

- `ProfileAvatar`, `ProfileHeroCard`, `DashboardCard`, `DashboardTopBar`, `SidebarProfileMenu` under `apps/web/components/dashboard/`.
- Avatar uploads: see [media-upload.md](./media-upload.md).
- Account & security on profile shows read-only **login code** with one-click copy (`ProfileLoginCodeField`; API field `loginCode` on `PublicUser`).

Notifications/messages counts are UI placeholders until backend exists.
