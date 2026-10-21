# Media uploads (Cloudinary)

Server-side uploads only. **`CLOUDINARY_*` secrets live in [`apps/api/.env`](../apps/api/.env)** (see [`.env.example`](../apps/api/.env.example)). The web app and admin must **not** store the API secret; browsers upload via BFF proxies. The API resolves `apps/api/.env` via [`load-api-env.ts`](../apps/api/src/config/load-api-env.ts) (works when `pnpm dev` runs from the repo root).

## Flow

1. Client [`MediaUpload`](../packages/ui/src/media/media-upload.tsx) (`@soulsync/ui/media/media-upload`) sends `multipart/form-data` field `file` to a Next BFF route with cookie auth.
2. BFF forwards to Nest with `Authorization: Bearer <JWT>`.
3. [`MediaService`](../apps/api/src/media/media.service.ts) validates size (≤ 5MB) and MIME, uploads with the `cloudinary` npm SDK, folder `soulsync/{tenantId}/{userId}/…`.

## API routes

| Method | Path                          | Purpose                                                                           |
| ------ | ----------------------------- | --------------------------------------------------------------------------------- |
| POST   | `/v1/auth/me/avatar`          | JPEG/PNG only; sets `User.avatarUrl` / `avatarPublicId`; returns `PublicUser`     |
| POST   | `/v1/auth/me/avatar/from-url` | JSON `{ url }` (HTTPS); Cloudinary fetches server-side; same DB update            |
| POST   | `/v1/media/upload`            | JPEG, PNG, or PDF; returns `{ url, publicId, resourceType, bytes }` (no DB write) |

Upload without Cloudinary env vars returns **503** with a clear message.

## Web BFF

- [`/api/account/avatar`](../apps/web/app/api/account/avatar/route.ts) → `POST /v1/auth/me/avatar`
- [`/api/account/avatar/from-url`](../apps/web/app/api/account/avatar/from-url/route.ts) → `POST /v1/auth/me/avatar/from-url`
- [`/api/media/upload`](../apps/web/app/api/media/upload/route.ts) → `POST /v1/media/upload`

Programmatic avatar upload: [`uploadAccountAvatar`](../apps/web/lib/account-api.ts), [`uploadAccountAvatarFromUrl`](../apps/web/lib/account-api.ts). File uploads with progress: [`upload-with-progress.ts`](../apps/web/lib/upload-with-progress.ts) (XHR).

## Database

User avatar columns require migration `20261021120000_user_avatar_fields`. Apply with `pnpm --filter @soulsync/db db:deploy` (or `db:migrate` locally).

## UI

- Profile hero: click avatar ([`profile-avatar-upload-trigger.tsx`](../apps/web/components/dashboard/profile-avatar-upload-trigger.tsx) — hover blur + upload icon) opens [`avatar-upload-dialog.tsx`](../apps/web/components/dashboard/avatar-upload-dialog.tsx) (drop zone, preview, % progress, HTTPS URL import).
- [`ProfileAvatar`](../apps/web/components/dashboard/profile-avatar.tsx) shows `avatarUrl` or initials.
- Reusable drop zone: [`account-avatar-upload.tsx`](../apps/web/components/media/account-avatar-upload.tsx) and [`MediaUpload`](../packages/ui/src/media/media-upload.tsx) for other pages.

## Admin (future)

Reuse `MediaUpload` with an admin BFF proxy to the same Nest routes once admin JWT auth exists. Example import: `@soulsync/ui/media/media-upload` with `uploadUrl` pointing at `/api/media/upload` (or admin equivalent).

## Display

`@cloudinary/url-gen` and `@cloudinary/react` are installed on web for transforms when needed. `next/image` allows `https://res.cloudinary.com/**` via [`apps/web/next.config.ts`](../apps/web/next.config.ts) `images.remotePatterns` (community posts, create-post modal avatars, etc.).

## Security

Rotate the Cloudinary **API secret** in the Cloudinary console if it was ever pasted in chat or committed. Never commit real credentials.
