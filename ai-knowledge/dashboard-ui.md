# Dashboard UI

Logged-in area under [`apps/web/app/(dashboard)/dashboard/`](<../apps/web/app/(dashboard)/dashboard/>).

## Routes

Path constants: [`apps/web/lib/dashboard-routes.ts`](../apps/web/lib/dashboard-routes.ts).

| Path                              | Page                                                                                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dashboard`                      | Redirects to `/dashboard/profile`                                                                                                                                          |
| `/dashboard/profile`              | My Profile — click avatar to open upload modal + information cards; hero shows points balance + link to history                                                            |
| `/dashboard/profile/transactions` | Points earn/spend history (times in biodata check-in time zone) — see [credits-wallet.md](./credits-wallet.md)                                                             |
| `/dashboard/settings`             | Editable account, email, username, password                                                                                                                                |
| `/dashboard/biodata`              | Section-based biodata builder (encrypted at rest on API)                                                                                                                   |
| `/dashboard/biodata/settings`     | Listing & audience (Private/Public, religion audience, photo/contact toggles), section visibility, permission queue — see [biodata-visibility.md](./biodata-visibility.md) |
| `/dashboard/messenger`            | E2EE 1:1 chat (Socket.io, block/restrict, link/YouTube previews) — see [messenger.md](./messenger.md) |

## Biodata location (geo)

- **UI**: Location section uses cascading **country → state → city** searchable selects (full filtered lists, no hidden cap; “Showing N of M” footer), **mother tongue** from REST Countries languages, **postal code** with country-specific format hint/regex ([`biodata-builder.tsx`](../apps/web/components/dashboard/biodata-builder.tsx), [`searchable-select-field.tsx`](../apps/web/components/dashboard/searchable-select-field.tsx), hook [`use-geo-location.ts`](../apps/web/lib/geo/use-geo-location.ts)).
- **BFF**: [`apps/web/app/api/geo/`](../apps/web/app/api/geo/) proxies Nest (no REST Countries key in the browser).
- **API**: [`apps/api/src/geo/`](../apps/api/src/geo/) — REST Countries v5 (`REST_COUNTRIES_*` in [`apps/api/.env`](../apps/api/.env)) + `country-state-city` for states/cities, merged with [`geo-state-overrides.ts`](../packages/shared-types/src/geo-state-overrides.ts) (e.g. BD districts missing from CSC). Routes under `GET /v1/geo/countries`.

Legacy URLs `/profile` and `/profile/settings` permanently redirect to the paths above ([`next.config.ts`](../apps/web/next.config.ts)).

Layout shell: [`dashboard-shell.tsx`](../apps/web/components/dashboard/dashboard-shell.tsx) — **desktop**: sticky sidebar (`h-screen`), scrollable nav, profile menu pinned at bottom, collapse chevron on the border (no footer collapse control). **Mobile**: full-screen bottom sheet ([`mobile-menu-sheet.tsx`](../apps/web/components/dashboard/mobile-menu-sheet.tsx)) slides up with backdrop, drag handle, Escape/backdrop dismiss, body scroll lock; same nav + profile footer as desktop.

## Brand

Forest green tokens live in [`packages/ui/src/styles.css`](../packages/ui/src/styles.css) (`--color-brand-*`, `--dashboard-header`). Shared button classes: [`apps/web/lib/ui-classes.ts`](../apps/web/lib/ui-classes.ts).

## Components

- `ProfileAvatar`, `ProfileHeroCard`, `DashboardCard`, `DashboardTopBar`, `SidebarProfileMenu` under `apps/web/components/dashboard/`.
- **International phone** ([`international-phone-field.tsx`](../apps/web/components/dashboard/international-phone-field.tsx)): guardian/candidate mobiles use circular flags from flagcdn (`CountryFlagIcon`, emoji fallback), trigger shows ISO + calling code, searchable full country list; row uses `overflow-visible` so the dropdown is not clipped. National digits are hard-capped at the typed country max including trunk prefix (`getPhoneNationalMaxLength` / `clampPhoneNationalDigits` in [`phone.ts`](../packages/shared-types/src/phone.ts), e.g. BD `01812-345678` = 11 digits). Extra keystrokes and paste are blocked; switching country truncates overflow. Saved as E.164.
- **Guardian messaging** (`guardian-contact-form.tsx`): optional WhatsApp/Telegram usernames or numbers in two columns — guardian stacked left (WhatsApp then Telegram), candidate stacked right. Save stays enabled (toast on validation); phones persist as E.164. Read view (`biodata-builder.tsx`) makes usernames/numbers clickable: WhatsApp → `https://wa.me/<user-or-digits>` (`messagingWhatsAppHref`), Telegram username → `https://t.me/<user>` (`messagingTelegramHref`); `target="_blank"` + `rel="noopener noreferrer"`. Empty/`—` and Telegram phone values are not linked.
- **Site header check-in** ([`header-explore-check-in.tsx`](../apps/web/components/header-explore-check-in.tsx)): logged-in users must check in once per day (user `Profile.checkInTimeZone` or UTC) before the CTA shows **Explore**; see [check-in-inactivity.md](./check-in-inactivity.md).
- **Points wallet** ([`profile-hero-card.tsx`](../apps/web/components/dashboard/profile-hero-card.tsx), [`profile-transactions.tsx`](../apps/web/components/dashboard/profile-transactions.tsx)): SSR balance on profile; `/dashboard/profile/transactions` lists `CreditTransaction` rows with signed +/- points.
- Avatar uploads: see [media-upload.md](./media-upload.md).
- Account & security on profile shows read-only **login code** with one-click copy (`ProfileLoginCodeField`; API field `loginCode` on `PublicUser`).

**Messages** icon in [`dashboard-top-bar.tsx`](../apps/web/components/dashboard/dashboard-top-bar.tsx) links to `/dashboard/messenger` and shows Redis-backed unread total. Sidebar **Messenger** under Account.
