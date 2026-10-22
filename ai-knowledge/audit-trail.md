# Admin audit trail

Canonical compliance log in Postgres `audit_events`, written in the same BullMQ job as member `user_activity_logs` fanout rows.

## Write path

`ActivityLogRecorder.publish(audit, entries)` → queue `activity-log` → `ActivityLogProcessor` transaction:

1. Optional daily dedupe (Redis `SET NX`) for `BIODATA_VIEWED`
2. `auditEvent.create`
3. `userActivityLog.createMany`

Member-facing copy uses **read-time** decryption + [`activity-log.presenter.ts`](../apps/api/src/activity-log/activity-log.presenter.ts) so titles never show `enc:v1:` ciphertext.

**Payload encryption:** New audit rows store human-readable fields in `payloadEnc` with blind `searchTokens`; admin list decrypts after role checks. Legacy plaintext columns are nullable during backfill.

## Admin API

JWT + `RolesGuard` (`SUPER_ADMIN`, `TENANT_ADMIN`):

| Endpoint | Purpose |
|----------|---------|
| `GET /v1/admin/activity-logs` | Filter by `actorId`, `targetUserId`, `type`, `status`, `dateFrom`, `dateTo`, cursor |
| `GET /v1/admin/activity-logs/user/:userId/timeline` | Actions **by** or **on** user; optional `otherUserId` for A↔B dyad |

**Tenant scope:** `TENANT_ADMIN` is limited to JWT `tenantId`. `SUPER_ADMIN` must pass query `tenantId`.

DTOs: `@soulsync/shared-types/audit-log`.

## Phase A instrumentation

- Auth: login success/failure, refresh success/failure (IP/UA from request context on auth routes)
- Bio view: `ProfileResumeService` → `BIODATA_VIEWED` (daily dedupe)
- Privacy: `patchVisibilityPolicy` → `BIODATA_PRIVACY_UPDATED`
- Existing product events map 1:1 audit row + member fanout

## Phase B (not yet wired)

Proposal/match, block/report, search queries — enum values reserved; hook when server endpoints exist.

See also [`activity-log.md`](activity-log.md) for member dashboard timeline.
