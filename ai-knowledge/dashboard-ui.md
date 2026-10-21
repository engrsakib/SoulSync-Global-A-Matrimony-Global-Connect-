# Dashboard UI

Logged-in area under [`apps/web/app/(dashboard)/dashboard/`](<../apps/web/app/(dashboard)/dashboard/>).

## Routes

Path constants: [`apps/web/lib/dashboard-routes.ts`](../apps/web/lib/dashboard-routes.ts).

| Path                  | Page                                            |
| --------------------- | ----------------------------------------------- |
| `/dashboard`          | Redirects to `/dashboard/profile`               |
| `/dashboard/profile`  | My Profile — read-only hero + information cards |
| `/dashboard/settings` | Editable account, email, username, password     |
| `/dashboard/biodata`  | Biodata placeholder (coming soon)               |

Legacy URLs `/profile` and `/profile/settings` permanently redirect to the paths above ([`next.config.ts`](../apps/web/next.config.ts)).

Layout shell: [`dashboard-shell.tsx`](../apps/web/components/dashboard/dashboard-shell.tsx) — sidebar nav, bottom profile menu, green top bar (search placeholder, date, message/notification icons via **react-icons**).

## Brand

Forest green tokens live in [`packages/ui/src/styles.css`](../packages/ui/src/styles.css) (`--color-brand-*`, `--dashboard-header`). Shared button classes: [`apps/web/lib/ui-classes.ts`](../apps/web/lib/ui-classes.ts).

## Components

- `ProfileAvatar`, `DashboardCard`, `DashboardTopBar`, `SidebarProfileMenu` under `apps/web/components/dashboard/`.

Notifications/messages counts are UI placeholders until backend exists.
