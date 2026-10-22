# Daily check-in and inactivity auto-private

## Environment (API)

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `DAILY_CHECKIN_POINTS` | `10` | Credit wallet bonus per check-in |
| `INACTIVITY_LIMIT_DAYS` | `30` | Days since last check-in before auto-private |
| `INACTIVITY_CRON` | `0 3 * * *` | BullMQ cron for inactivity scan (UTC) |

Requires `REDIS_URL` for BullMQ worker.

## Data model

- `User.lastCheckInAt` — UTC timestamp of last successful check-in
- `Profile.checkInTimeZone` — IANA zone for calendar-day boundary (set when **Location** country is saved)
- `Profile.isVisibilityPrivate` — inactivity flag; kept in sync with listing via `isDiscoverable` (`isVisibilityPrivate = !isDiscoverable` on privacy patch)

Users with **`lastCheckInAt` null** are never auto-privated by the job.

## API (JWT)

Nest module [`apps/api/src/check-in/`](../apps/api/src/check-in/):

| Method | Path | Role |
| ------ | ---- | ---- |
| GET | `/v1/check-in/status` | Today's status, points config, wallet balance |
| POST | `/v1/check-in` | Check in once per calendar day (user timezone or UTC); idempotent same day |

Credits: `CreditWallet` + `CreditTransaction` type `BONUS`, reference `daily-check-in`.

## Background job

Queue `profile-inactivity`, job `scan-inactive-profiles`, daily repeatable scheduler in [`apps/api/src/inactivity/`](../apps/api/src/inactivity/).

Updates profiles where `isVisibilityPrivate = false`, **`hasConfirmedMarriage = false`**, and `user.lastCheckInAt < now - INACTIVITY_LIMIT_DAYS` → `isVisibilityPrivate = true`, `isDiscoverable = false`.

Members with at least one **confirmed** marriage (`Profile.hasConfirmedMarriage`, set when a partner accepts) are **exempt** from this auto-private scan. See [`marriage-confirmation.md`](marriage-confirmation.md).

## Web

- BFF: `apps/web/app/api/check-in` (GET/POST)
- Public header CTA [`header-explore-check-in.tsx`](../apps/web/components/header-explore-check-in.tsx): logged-in users see **Check in** until checked in today, then **Explore** → `/communities` (public site shell, auth required). Nav **Communities** → same route.

## Timezone

When biodata **Location** is saved, `Profile.checkInTimeZone` is stored (member can pick from country time zones in `LocationForm` after postal code, or type IANA). If omitted on patch, API sets the primary zone from REST Countries when `country` changes.
