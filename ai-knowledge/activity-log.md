# User activity log

Per-user audit-style timeline at `/dashboard/activity-log`. Separate from bell notifications (`UserNotification`).

## Write path (async)

1. Domain code calls `ActivityLogRecorder` (or `ActivityLogPublisher.record`) **after** successful DB commits.
2. `ActivityLogPublisher` enqueues BullMQ job `persist-activity-log` on queue `activity-log` (fire-and-forget; errors logged, not thrown).
3. `ActivityLogProcessor` runs `UserActivityLog.createMany` in the API Nest process (same worker host as profile inactivity).

Requires `REDIS_URL`. Global Bull root lives in `apps/api/src/queue/queue.module.ts`; feature modules only `registerQueue`.

## Read path

- API: `GET /v1/activity-log` (JWT), cursor pagination, hydrates actor/related display fields.
- Web BFF: `apps/web/app/api/activity-log/route.ts` → client `fetchActivityLog`.

Timestamps stored as UTC `occurredAt`; list response includes `viewerTimeZone` from `Profile.checkInTimeZone` (via `effectiveCheckInTimeZone`). UI shows relative + timezone-aware absolute times.

## Data model

Prisma enum `UserActivityType` and table `UserActivityLog` (`userId`, `type`, `title`, `body`, `linkPath`, `actorUserId`, `relatedUserId`, `metadata`, `occurredAt`). Index `(userId, occurredAt desc, id)`.

Shared DTOs: `@soulsync/shared-types/activity-log`.

## v1 instrumented events

| Area | Types |
|------|--------|
| Profile | `PROFILE_UPDATED` |
| Biodata (owner) | `BIODATA_UPDATED` |
| Managed biodata (editor) | `BIODATA_UPDATED_BY_EDITOR`, `BIODATA_EDITED_FOR_OWNER` |
| View access | `BIODATA_ACCESS_REQUEST_*`, `BIODATA_ACCESS_REQUEST_DECIDED` |
| Editor grants | `BIODATA_EDITOR_INVITE`, `BIODATA_EDITOR_REQUEST`, `BIODATA_EDITOR_DECIDED` |
| Communities | `COMMUNITY_COMMENT_CREATED`, `COMMUNITY_REACTION_ADDED` (new reaction only), `COMMUNITY_POST_UPDATED` |

Dual-party events enqueue **one** job with multiple row entries.

## Follow-ups

- Optional Redis dedupe for noisy biodata autosaves.
- Explicit “share biodata link” when a server-visible share endpoint exists.
