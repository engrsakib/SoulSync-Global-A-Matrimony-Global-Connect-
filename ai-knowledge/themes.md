# Multi-theme controller (`@soulsync/web`)

User-controlled appearance only — **no time-of-day auto switching**.

## Preferences

Stored value (cookie + Redis): `light` | `dark` | `system` | `cool-slate` | `sepia` | `amoled` | `sage-nature`.

- **Default:** `light` (existing `:root` tokens in [`packages/ui/src/styles.css`](../packages/ui/src/styles.css)).
- **`system`:** resolves to `light` or `dark` via `prefers-color-scheme` (SSR uses `Sec-CH-Prefers-Color-Scheme` when present; blocking [`ThemeScript`](../apps/web/components/theme/theme-script.tsx) before paint).

Applied DOM palette: `html[data-theme]` ∈ `light`, `dark`, `cool-slate`, `sepia`, `amoled`, `sage-nature`.

Shared types: [`packages/shared-types/src/theme.ts`](../packages/shared-types/src/theme.ts).

## Persistence

| Layer | Detail |
| ----- | ------ |
| Cookie `ss_device_id` | UUID v4, httpOnly, 360-day max-age |
| Cookie `ss_theme_pref` | Preference string, httpOnly, 360-day max-age (fast SSR) |
| Redis | Key `theme:pref:v1:{deviceId}`, TTL **31_104_000** s, via `REDIS_URL` on web BFF |

**SSR read order:** `ss_theme_pref` cookie → Redis → `light`.

**Cookie backfill:** If SSR loaded from Redis only, [`ThemeHydrator`](../apps/web/components/theme/theme-hydrator.tsx) calls `GET /api/user/theme` **once per browser tab** (`sessionStorage` + ref guard) to set cookies—no context updates.

**Client writes:** `POST /api/user/theme` (Redis) runs **only** when the user picks a theme in [`ThemeSwitcher`](../apps/web/components/theme/theme-switcher.tsx) via [`ThemeProvider.setTheme`](../apps/web/components/theme/theme-provider.tsx)—never on mount.

## API (Next BFF)

- `GET /api/user/theme` — returns `{ preference, resolvedTheme }`; refreshes cookies.
- `POST /api/user/theme` — body `{ theme }`; Redis `SETEX` + cookies.

## UI

- Public [`SiteHeader`](../apps/web/components/site-header.tsx): compact switcher.
- Dashboard [`DashboardShell`](../apps/web/components/dashboard/dashboard-shell.tsx): sidebar row above profile menu.
- Hook: `useThemeController()` → `{ preference, currentTheme, resolvedTheme, setTheme, isFixed: true }`.

## Middleware

[`apps/web/middleware.ts`](../apps/web/middleware.ts) issues `ss_device_id` and forwards `x-ss-device-id` on all non-static routes; auth redirect behavior unchanged for `/dashboard`, `/communities`, `/biodata`.

## Form controls

Native inputs, selects, and dropdown panels in `@soulsync/web` should use shared classes from [`apps/web/lib/ui-classes.ts`](../apps/web/lib/ui-classes.ts)—not `bg-white` or fixed grays.

| Export | Use |
| ------ | --- |
| `formControlClass` | h-11 fields: `bg-[var(--card)]`, `text-[var(--foreground)]`, `placeholder:text-[var(--muted-foreground)]`, `ring-[var(--ring)]` |
| `formControlReadOnlyClass` | Disabled/read-only fields |
| `formPopoverPanelClass` | Searchable select lists, phone country picker, typeahead menus |
| `formSurfaceClass` | Bordered nested rows/cards on forms |

[`@soulsync/ui` `Input`](../packages/ui/src/components/input.tsx) and [`IsoDatePicker`](../packages/ui/src/components/iso-date-picker.tsx) use the same CSS variables. Hero/header **overHero** overlays (`bg-white/10`, etc.) stay light-on-brand by design.
