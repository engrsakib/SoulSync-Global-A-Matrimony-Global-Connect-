# Trusted biodata editors (manage on behalf)

**Edit delegation** is separate from **view access** (`BiodataAccessRequest`). An approved **editor** acts on an **owner** profile within an **edit scope**. Editors cannot change account email/password, billing, invite other editors, or log in as the owner.

## Scopes

| Scope      | Editor can                                                    |
| ---------- | ------------------------------------------------------------- |
| `CONTENT`  | Managed `me`, section PATCH (except `privacy`), gallery       |
| `SETTINGS` | Visibility policy, section `privacy`, owner view-access queue |
| `BOTH`     | All of the above (legacy default)                             |

Prisma: `BiodataEditorGrant.scope` (`BiodataEditorScope`), default `BOTH`.

Shared helpers: `scopeAllowsContent`, `scopeAllowsSettings`, `scopeLabel` in [`packages/shared-types/src/biodata-editor-grant.ts`](../packages/shared-types/src/biodata-editor-grant.ts).

## Data model

Prisma: `BiodataEditorGrant` — `ownerUserId`, `editorUserId`, `status`, `initiatedBy`, `scope`, optional `message` / `expiresAt`, `tenantId`.

## API (JWT)

Module [`apps/api/src/biodata-editor/`](../apps/api/src/biodata-editor/):

| Method | Path                                         | Role                                                                                     |
| ------ | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| GET    | `/v1/biodata/editor-grants/mine-as-owner`    | Pending incoming/outgoing, active editors, history                                       |
| GET    | `/v1/biodata/editor-grants/mine-as-editor`   | Pending invites, active managed summaries (incl. scope, pending view count), history     |
| GET    | `/v1/biodata/editor-grants/member-search?q=` | Tenant username prefix search                                                            |
| POST   | `/v1/biodata/editor-grants/invite`           | Owner → `{ editorUsername, message?, scope? }` (default `BOTH`)                          |
| POST   | `/v1/biodata/editor-grants/request`          | Editor → `{ ownerUsername, message? }`                                                   |
| POST   | `/v1/biodata/editor-grants/:id/decide`       | `{ decision, scope? }` — **scope required** when owner approves editor-initiated request |
| PATCH  | `/v1/biodata/editor-grants/:id/scope`        | Owner only, active grant → `{ scope }`                                                   |

**Managed biodata** `/v1/biodata/managed/:ownerUserId/`:

| Routes                                          | Guard                     |
| ----------------------------------------------- | ------------------------- |
| `GET me`                                        | Any approved grant (view) |
| `sections/*` (not `privacy`), gallery           | `assertCanEditContent`    |
| `sections/privacy`, visibility, access-requests | `assertCanEditSettings`   |

Enforcement: `BiodataEditorAccessService` — `assertCanViewManaged`, `assertCanEditContent`, `assertCanEditSettings`; insufficient scope → **403** with message.

Rate limit: 20 invite/request actions per user per 24h.

Notifications mention scope where relevant (`BIODATA_EDITOR_*`).

## Web

- Owner: `BiodataTrustedEditorsCard` — invite scope picker; active rows show badge, **Change access** (PATCH scope), revoke.
- Permission hub: `/dashboard/biodata/permission-requests` — **View access** | **Edit access**; approve edit requests via scope dialog. Edit tab pending/history rows show editor avatar, display name, and link to `/biodata/[username]`.
- Editor list: `/dashboard/biodata/managed` → **Open overview** per profile.
- Managed workspace routes:
  - `/dashboard/biodata/managed/[username]` — overview hub (`ManagedProfileHub`)
  - `.../edit` — builder (content scope)
  - `.../settings` — biodata settings (settings scope)
  - `.../permissions` — owner view-access queue (settings scope; edit tab hidden)
- Context: `ManagedBiodataProvider` — `ownerUserId`, `scope`, `canEditContent`, `canEditSettings`.
- BFF: `apps/web/app/api/biodata/editor-grants/` including `[id]/scope`; managed routes under `.../managed/[ownerUserId]/`.
