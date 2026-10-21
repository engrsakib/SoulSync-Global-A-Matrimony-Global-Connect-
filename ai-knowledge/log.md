# Change log

Newest first. One line per meaningful task.

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
