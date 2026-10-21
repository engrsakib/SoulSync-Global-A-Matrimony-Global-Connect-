# Member communities (groups)

## Tenant vs group

| Concept | Model | UI |
| ------- | ----- | -- |
| Platform “community” (tenant site) | `Tenant` | Homepage `#communities`, tenant branding |
| Member-created **group** | `Community` | `/communities`, `/communities/[slug]`, member profiles under `/communities/[slug]/members/[username]` |

Every `Community` has `tenantId`. Slugs are unique per tenant: `@@unique([tenantId, slug])`. Members only see and join groups in their own tenant (same rule as biodata access).

## Data model (Prisma)

Package: [`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma) — `Community`, `CommunityMember`, `CommunityJoinRequest`, `CommunityPost`, `CommunityPostImage`, `CommunityComment`, `CommunityReaction`.

Migration: `20261021200000_member_communities`.

## Shared DTOs

[`packages/shared-types/src/communities.ts`](../packages/shared-types/src/communities.ts) — import `@soulsync/shared-types/communities`.

Feed authors use `{ id, username, avatarUrl }` only (no display name).

Helpers: `canModerateCommunity`, `isCommunityAdminRole`, `isCommunityOwnerRole`.

## API (NestJS)

Module: [`apps/api/src/communities/`](../apps/api/src/communities/) — registered in `app.module.ts`.

| Area | Prefix / route |
| ---- | -------------- |
| CRUD + join | `GET/POST /v1/communities`, `GET/PATCH/DELETE /v1/communities/:slug` |
| Join | `POST .../join`, `GET .../join-requests`, `POST .../join-requests/:id/decide` |
| Members | `GET/PATCH .../members`, `POST .../members/:userId/block|remove`, `GET .../members/search?q=` |
| Username UX | `GET .../members/:username`, `GET .../members/:username/posts` |
| Posts | `GET/POST .../posts` (`?moderationQueue=true` for pending queue), `POST .../posts/:id/decide`, `PATCH/DELETE .../posts/:id` |
| Social | Comments and reactions under `.../posts/:postId/...` |
| Public share | `GET /v1/community-posts/share/:shareToken` (no JWT; public community + published post) |

Slug: generated on create from name via `CommunitySlugService`; not changed when name updates.

Join eligibility: `CommunityEligibilityService` — religion, decrypted profile country, age from DOB, active user, not blocked.

Post approval modes: `AUTO_APPROVE`, `ALL_PENDING`, `TRUSTED_AUTO_REST_PENDING` (+ member `isTrustedPoster`).

## Web (BFF + routes)

Auth: middleware on `/communities/:path*` (cookie `ss_access`).

### App routes (public shell)

- [`apps/web/app/(public)/communities/page.tsx`](../apps/web/app/(public)/communities/page.tsx) — group directory (SSR list, search, tabs, create)
- [`apps/web/app/(public)/communities/[slug]/page.tsx`](../apps/web/app/(public)/communities/[slug]/page.tsx) — feed, composer (text + images), reactions, comments, mod queue
- [`apps/web/app/(public)/communities/[slug]/members/[username]/page.tsx`](../apps/web/app/(public)/communities/[slug]/members/[username]/page.tsx) — member post history

UI: [`apps/web/components/communities/`](../apps/web/components/communities/). Client API: [`apps/web/lib/communities-client.ts`](../apps/web/lib/communities-client.ts); SSR: [`communities-server.ts`](../apps/web/lib/communities-server.ts).

### BFF (JWT proxy)

- `app/api/communities` — list / create
- `app/api/communities/[slug]` — detail / patch / delete
- `app/api/communities/[slug]/join` — join or request
- `app/api/communities/[slug]/posts` — feed / create post
- `app/api/communities/[slug]/posts/[postId]` — patch / delete post
- `app/api/communities/[slug]/posts/[postId]/decide` — approve / reject
- `app/api/communities/[slug]/posts/[postId]/comments` — list / create comments
- `app/api/communities/[slug]/posts/[postId]/reactions` — PUT / DELETE
- `app/api/communities/[slug]/posts/[postId]/comments/[commentId]/reactions` — PUT / DELETE
- `app/api/communities/[slug]/members/[username]` — member card
- `app/api/communities/[slug]/members/[username]/posts` — member feed
- [`app/api/community-posts/share/[shareToken]/route.ts`](../apps/web/app/api/community-posts/share/[shareToken]/route.ts) — public share metadata

Shared helper: [`apps/web/app/api/communities/_proxy.ts`](../apps/web/app/api/communities/_proxy.ts).
