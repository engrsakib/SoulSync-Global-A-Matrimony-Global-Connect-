# Biodata section visibility and access requests

Owners control which biodata sections are **Direct** (visible without asking) vs **Need permission** (request queue). **Personal details** (`basic`) is always Direct and cannot be changed. The `privacy` biodata section is owner-only settings and is not listed here.

## Data model

Prisma (`packages/db/prisma/schema.prisma`):

- `BiodataSectionVisibility` — `ownerUserId` + `sectionId` → `DIRECT` | `REQUEST` (default missing row: `basic` = Direct, others = Request)
- `BiodataAccessRequest` — requester asks owner for a section; statuses `PENDING`, `APPROVED`, `DENIED`, `REVOKED`, `EXPIRED`; `expiresAt` null = forever grant

Partial unique index: one `PENDING` row per `(ownerUserId, requesterUserId, sectionId)`.

Shared types: [`packages/shared-types/src/biodata-visibility.ts`](../packages/shared-types/src/biodata-visibility.ts).

## API (JWT)

Nest module [`apps/api/src/biodata-visibility/`](../apps/api/src/biodata-visibility/):

| Method | Path | Role |
| ------ | ---- | ---- |
| GET | `/v1/biodata/visibility` | Owner policy (all shareable sections resolved) |
| PATCH | `/v1/biodata/visibility` | Upsert section modes |
| GET | `/v1/biodata/access-requests` | Owner queue + recent history |
| POST | `/v1/biodata/access-requests` | Requester creates pending request |
| POST | `/v1/biodata/access-requests/:id/decide` | Owner approve / deny / revoke |

Approve body: `decision`, optional `audience` (`requester` | `everyone`), `forever` or `expiresAt`. **All members** sets section visibility to `DIRECT` for that section.

**Not enforced yet:** other users viewing biodata; search/discovery. Policies are stored for a future public-profile viewer.

## Web

- Route: `/dashboard/biodata/settings` — [`biodata-settings.tsx`](../apps/web/components/dashboard/biodata-settings.tsx)
- BFF: `apps/web/app/api/biodata/visibility`, `.../access-requests`, `.../access-requests/[id]/decide`
- Sidebar: **Biodata settings** (separate from **Biodata** builder at `/dashboard/biodata`)
