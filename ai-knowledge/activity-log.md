# User activity log

Per-user audit-style timeline at `/dashboard/activity-log`. Separate from bell notifications (`UserNotification`).

## Security (encrypted payloads)

- **At rest:** Human-readable fields (`title`, `body`, `linkPath`, `metadata`, IP, User-Agent) are stored in `payloadEnc` (AES-256-GCM via `BIODATA_MASTER_KEY` / `enc:v1`, same as biodata field crypto).
- **Queryable plaintext:** `tenantId`, `userId`, `type`, actor/target IDs, `occurredAt`, `searchTokens` (HMAC blind indexes — never store raw search terms).
- **Read path:** API decrypts only after JWT auth; member feed uses presenter + decrypted user labels for titles.
- **Legacy rows:** Plaintext columns nullable; backfill `packages/db/scripts/backfill-encrypted-activity.mjs` then verify new writes leave legacy columns null.

## Write path (async)

1. Domain code calls `ActivityLogRecorder` **after** successful DB commits.
2. `ActivityLogPublisher` enqueues BullMQ `persist-activity-log` on queue `activity-log`.
3. `ActivityLogProcessor` normalizes logical payloads, encrypts, dual-writes `AuditEvent` + `UserActivityLog` in one transaction when both are present.

Requires `REDIS_URL`. Global Bull root: `apps/api/src/queue/queue.module.ts`.

## Read path (member feed)

- API: `GET /v1/activity-log` — JWT, keyset cursor, optional `types[]`, `dateFrom`, `dateTo`, `q` (blind token search), `sort=newest|oldest`, `limit` (max 50).
- Web BFF: `apps/web/app/api/activity-log/route.ts` forwards query params; client `fetchActivityLog(query, cursor?)`.
- UI: `/dashboard/activity-log` — filters, debounced search, date groups, `IntersectionObserver` infinite scroll + manual “Load more”.

Timestamps: UTC `occurredAt`; response `viewerTimeZone` from profile check-in timezone.

## Data model

- `UserActivityLog`: encrypted payload + `searchTokens` GIN index; index `(userId, type, occurredAt, id)`.
- `AuditEvent`: same encryption pattern (admin APIs in [`audit-trail.md`](audit-trail.md)).
- `AuthSession`: durable refresh rotation (`sid` on JWT), encrypted device/IP payload; logout revokes session.

Shared DTOs: `@soulsync/shared-types/activity-log`.

## Instrumented events (high level)

Profile/biodata/access/editor, communities (join, join request, comments, reactions add/change/remove, posts), biodata views/privacy, auth (register, guest, login/refresh audit, logout + member session events). Extend via `ActivityLogRecorder` only after domain success.

Dual-party events enqueue one audit row plus member fanout rows (self-fanout skipped for reactions where actor equals target).
