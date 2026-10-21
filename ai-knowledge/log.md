# Change log

Newest first. One line per meaningful task.

- 2026-10-21: Dashboard sidebar: viewport-height sticky layout, scrollable nav, profile footer fixed, collapse toggle moved to header.
- 2026-10-21: Biodata education & career: structured degree/career fields on Profile, grouped UI, encrypted strings + legacy `education` summary sync.
- 2026-10-21: `MaritalStatus.MARRIED` added (second-marriage biodata option); UI labels via `MARITAL_STATUS_LABELS`.
- 2026-10-21: Biodata location cascades (REST Countries + country-state-city): `GET /v1/geo/*`, web BFF, Profile `stateRegion`/`postalCode`, encrypted at rest.
- 2026-10-21: ESLint skips type-checked project service for `test/` and `scripts/`; ignores compiled `scripts/**/*.js` so pre-commit does not lint tsc output.
- 2026-10-21: Biodata builder at `/dashboard/biodata` with JWT `GET/PATCH /v1/biodata/me` and AES-256-GCM field encryption (`BIODATA_MASTER_KEY`).
- 2026-10-21: Email set/change confirm sets `users.isGuest` false when `emailVerifiedAt` is written (guest → member).
- 2026-10-21: `userDisplayLabel` prefers trimmed first + last name (profile hero/header) over username or `Guest {lastName}`.
- 2026-10-21: Profile overview uses `useCurrentUser` so name/email/username refresh after settings (no stale RSC snapshot).
- 2026-10-21: `GET /auth/me` ensures every user has retrievable `loginCode` (issues stored code if legacy row lacked `loginCodeEnc`).
- 2026-10-21: Profile Account & security shows read-only login code (encrypted `loginCodeEnc`, copy button); backfill on guest login.
- 2026-10-21: Logged-in users hitting `/login` or `/register` redirect to `/dashboard/profile`.
- 2026-10-21: Pre-commit Prettier — `prettier-plugin-prisma` for `schema.prisma`; API env.schema Cloudinary URL fallback type fix.
- 2026-10-21: API loads `apps/api/.env` reliably for Cloudinary (monorepo cwd); optional `CLOUDINARY_URL` fallback.
- 2026-10-21: Profile avatar modal (hover trigger, XHR progress, URL import); `avatarUrl` migration deploy; `POST /auth/me/avatar/from-url`.
- 2026-10-21: Cloudinary API-first uploads — avatar on User, Nest media module, web BFF, reusable `@soulsync/ui` `MediaUpload`.
- 2026-10-21: Dashboard URLs moved to `/dashboard/profile`, `/dashboard/settings`, `/dashboard/biodata`; old `/profile*` redirects.
- 2026-10-21: Profile settings — suggest strong password (`generateStrongPassword` in shared-types) fills password + confirm fields.
- 2026-10-21: Global forest-green brand; dashboard reference layout (top bar, sidebar profile menu, /profile vs /profile/settings).
- 2026-10-21: Dashboard email modal — 6-box OTP, confirm/resend on expiry, backdrop/Escape dismiss (no Cancel).
- 2026-10-21: Swagger architecture — CLI DTO plugin, envelope-aware decorators, full auth/account/email/health/tenant route docs at `/docs`.
- 2026-10-21: Dashboard email set/change with SMTP 6-digit codes (5 min), guest placeholder hidden, Redis OTP, and profile dialog UX.
- 2026-10-21: `GET /` uses the success envelope; errors are always enveloped; only health success responses stay raw for Terminus.
- 2026-10-21: Added typed API response envelope in `@soulsync/shared-types`, global Nest interceptor/filter, and BFF `unwrapApiPayload` shims in web/admin.
- 2026-10-21: Pre-commit runs ESLint once per package config, and the quality note no longer contains the unfinished-work marker the commit hook rejects.
- 2026-10-21: Web lint is clean: auth route JSON is typed as `unknown`, form handlers do not pass raw promises to React events, and the current-user refresh is scheduled outside the effect body.
- 2026-10-21: Pre-commit chunks Prettier and ESLint commands for the Windows command-line limit, and Next.js ESLint resolves each app directory from the repo root. Added this `ai-knowledge` folder.
- 2026-10-21: Login and registration use extra top padding in `AuthPageShell` so the forms sit below the fixed 64px header.
