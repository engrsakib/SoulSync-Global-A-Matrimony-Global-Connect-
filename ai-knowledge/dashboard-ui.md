# Dashboard UI

Logged-in area under [`apps/web/app/(dashboard)/`](<../apps/web/app/(dashboard)/>).

## Routes

| Path                | Page                                            |
| ------------------- | ----------------------------------------------- |
| `/profile`          | My Profile — read-only hero + information cards |
| `/profile/settings` | Editable account, email, username, password     |

Layout shell: [`dashboard-shell.tsx`](../apps/web/components/dashboard/dashboard-shell.tsx) — sidebar nav, bottom profile menu, green top bar (search placeholder, date, message/notification icons via **react-icons**).

## Brand

Forest green tokens live in [`packages/ui/src/styles.css`](../packages/ui/src/styles.css) (`--color-brand-*`, `--dashboard-header`). Shared button classes: [`apps/web/lib/ui-classes.ts`](../apps/web/lib/ui-classes.ts).

## Components

- `ProfileAvatar`, `DashboardCard`, `DashboardTopBar`, `SidebarProfileMenu` under `apps/web/components/dashboard/`.

Notifications/messages counts are UI placeholders until backend exists.
