# Biodata section visibility and access requests

Owners control which biodata sections are **Direct** (visible without asking) vs **Need permission** (request queue). **Personal details** (`basic`) is always Direct and cannot be changed. **Photo gallery** (`photo_gallery`) is always permission-gated (never Direct; excluded from “request whole biodata access” batch). The `privacy` biodata section is owner-only settings and is not listed here.

## Data model

Prisma (`packages/db/prisma/schema.prisma`):

- `BiodataSectionVisibility` — `ownerUserId` + `sectionId` → `DIRECT` | `REQUEST` (default missing row: `basic` = Direct, others = Request)
- `BiodataAccessRequest` — requester asks owner for a section; statuses `PENDING`, `APPROVED`, `DENIED`, `REVOKED`, `EXPIRED`; `expiresAt` null = forever grant

Partial unique index: one `PENDING` row per `(ownerUserId, requesterUserId, sectionId)`.

Shared types: [`packages/shared-types/src/biodata-visibility.ts`](../packages/shared-types/src/biodata-visibility.ts).

## API (JWT)

Nest module [`apps/api/src/biodata-visibility/`](../apps/api/src/biodata-visibility/):

| Method | Path                                     | Role                                           |
| ------ | ---------------------------------------- | ---------------------------------------------- |
| GET    | `/v1/biodata/visibility`                 | Owner policy (all shareable sections resolved) |
| PATCH  | `/v1/biodata/visibility`                 | Upsert section modes                           |
| GET    | `/v1/biodata/access-requests`            | Owner queue + recent history                   |
| POST   | `/v1/biodata/access-requests`            | Requester creates pending request              |
| POST   | `/v1/biodata/access-requests/:id/decide` | Owner approve / deny / revoke                  |

Approve body: `decision`, optional `audience` (`requester` | `everyone`), `forever` or `expiresAt`. **All members** sets section visibility to `DIRECT` for that section.

Member viewer (JWT), [`apps/api/src/biodata/biodata-view.service.ts`](../apps/api/src/biodata/biodata-view.service.ts):

| Method | Path                                 | Role                                                      |
| ------ | ------------------------------------ | --------------------------------------------------------- |
| GET    | `/v1/biodata/members/:username/view` | Permission-based biodata for another member (same tenant) |

DTOs: [`packages/shared-types/src/biodata-view.ts`](../packages/shared-types/src/biodata-view.ts). Per section: `visible` (Direct or approved grant), `locked` / `pending` / `denied` / `expired`, or `not_applicable` (`islam_sharia` when owner is not Islam). Share links **override private listing** (`isDiscoverable === false`) but still enforce **religion audience** and section policy. Avatar obeys `photoVisibility` (`PUBLIC` / `MEMBERS_ONLY` only when viewer may open the page).

**Not enforced yet:** search/discovery listing filters.

## Listing & audience (privacy section)

Stored on `Profile` via `PATCH /v1/biodata/me/sections/privacy`:

- **Private / Public** → `isDiscoverable` (false / true)
- **Who can view** → `discoveryReligionMode` (`SAME_AS_MINE` | `ALL_RELIGIONS` | `SELECTED_RELIGIONS`) + `discoveryReligionAllowList` (`Religion[]`)
- Photo visibility, contact-after-accept, hide from contacts, guardian-managed (same as before)

UI labels: [`biodata-discovery-settings.ts`](../packages/shared-types/src/biodata-discovery-settings.ts). Edited on **Biodata settings** (`biodata-discovery-settings.tsx`); biodata builder **Privacy & discovery** is read-only with link to settings.

Religion audience is enforced on **member biodata viewer** (`viewerMatchesDiscoveryReligionAudience`); not enforced in search yet.

## Web

- Route: `/dashboard/biodata/settings` — discovery + per-section visibility ([`biodata-settings.tsx`](../apps/web/components/dashboard/biodata-settings.tsx)); link to permission queue
- Route: `/dashboard/biodata/permission-requests` — pending approve/deny, recent decisions, match % per requester ([`biodata-permission-requests.tsx`](../apps/web/components/dashboard/biodata-permission-requests.tsx)); sidebar **Permission requests** with pending count badge (refreshes via `ss:biodata-access-requests-changed`). Access-request `requester.displayName` is **decrypted** in [`BiodataVisibilityService`](../apps/api/src/biodata-visibility/biodata-visibility.service.ts) (web falls back if ciphertext still appears).
- Member viewer: `/biodata/[username]` — [`member-biodata-view.tsx`](../apps/web/components/biodata/member-biodata-view.tsx); self → redirect `/dashboard/biodata`; **Request whole biodata access** batches `POST` access requests for all locked/denied/expired sections except `photo_gallery`. Client deterrence + resume API: [`biodata-protection.md`](biodata-protection.md).
- Photo gallery: 3–9 JPEG/PNG (5MB) via `BiodataGalleryPhoto` + `/v1/biodata/me/gallery/*`; owner UI [`biodata-photo-gallery-section.tsx`](../apps/web/components/dashboard/biodata-photo-gallery-section.tsx) after Personal details on biodata builder; edits (add/remove/reorder) are **staged until Save section**; delete API removes DB row and Cloudinary `publicId`; uploads use shared [`profile-image-upload-dialog.tsx`](../apps/web/components/dashboard/profile-image-upload-dialog.tsx) (file-only for gallery). Read-only grid [`biodata-photo-gallery-grid.tsx`](../apps/web/components/biodata/biodata-photo-gallery-grid.tsx) opens [`biodata-gallery-lightbox.tsx`](../apps/web/components/biodata/biodata-gallery-lightbox.tsx) on thumbnail click (blur backdrop, Close, Esc; copy/right-click/save/print blocked when bio protection enabled).
- BFF: `apps/web/app/api/biodata/visibility`, `.../access-requests`, `.../access-requests/[id]/decide`, `.../members/[username]/view`; compatibility via `/api/profiles/:userId/compatibility`
- Sidebar: **Biodata** builder, **Biodata settings**, **Permission requests**
