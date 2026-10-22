# JWT access and refresh tokens

## Environment (API — [`apps/api/.env.example`](../apps/api/.env.example))

| Variable             | Purpose                 | Default                                    |
| -------------------- | ----------------------- | ------------------------------------------ |
| `JWT_ACCESS_SECRET`  | Sign/verify access JWT  | Falls back to legacy `JWT_SECRET` if unset |
| `JWT_REFRESH_SECRET` | Sign/verify refresh JWT | Required (min 16 chars)                    |
| `JWT_ACCESS_TTL`     | Access lifetime         | `2m`                                       |
| `JWT_REFRESH_TTL`    | Refresh lifetime        | `7d`                                       |

Web app sets httpOnly cookie `maxAge` from the same TTL env vars ([`apps/web/.env.example`](../apps/web/.env.example)).

## API

- [`JwtTokenService`](../apps/api/src/auth/jwt.service.ts): `signAccess` / `verifyAccess`, `signRefresh` / `verifyRefresh` (`typ: 'refresh'`).
- Login/register/guest responses include `accessToken` + `refreshToken` ([`AuthService`](../apps/api/src/auth/auth.service.ts)).
- `POST /v1/auth/refresh` body `{ refreshToken }` — rotates both tokens.

[`JwtAuthGuard`](../apps/api/src/auth/jwt-auth.guard.ts) accepts **access** tokens only. Access JWTs **must** include `sid`; guard calls [`AuthSessionService.assertAccessSessionActive`](../apps/api/src/auth/auth-session.service.ts) (Redis cache `auth:sess:valid:{sid}` + Postgres `auth_sessions`) so **logout revokes access immediately**.

## Web

| Cookie  | Name         | Content                                    |
| ------- | ------------ | ------------------------------------------ |
| Access  | `ss_access`  | Bearer access JWT                          |
| Refresh | `ss_refresh` | Refresh JWT (not sent to biodata upstream) |

- Auth BFF: login/register/guest set both cookies; [`POST /api/auth/refresh`](../apps/web/app/api/auth/refresh/route.ts) exchanges refresh for a new pair; logout clears both.
- SSR/BFF: [`getValidAccessTokenFromCookies()`](../apps/web/lib/auth-cookie.ts) uses a fresh access JWT or calls Nest `POST /auth/refresh` and **writes both rotated tokens back** to httpOnly cookies (required because refresh rotation invalidates the previous refresh hash server-side).
- API sessions: [`AuthSessionService`](../apps/api/src/auth/auth-session.service.ts) stores refresh hash + `sid` on JWT; logout revokes the session row and marks Redis cache inactive.
- Partner preferences: Nest `JwtAuthGuard` on [`partner-preferences`](../apps/api/src/partner-preferences/partner-preferences.controller.ts); web BFF [`/api/partner-preferences`](../apps/web/app/api/partner-preferences/route.ts) (no direct Nest + `X-User-Id`). Admin app still uses legacy dev header client — migrate separately.
- Browser BFF clients: [`bffFetch`](../apps/web/lib/bff-fetch.ts) (401 → single-flight `/api/auth/refresh` → retry) used by auth, communities, notifications, activity log, wallet, account, editor grants, partner preferences.
- Middleware: protected routes allow `ss_access` **or** `ss_refresh` so expired access does not force login before refresh.

## Module note

[`BiodataEditorModule`](../apps/api/src/biodata-editor/biodata-editor.module.ts) imports [`AuthModule`](../apps/api/src/auth/auth.module.ts) so `JwtAuthGuard` resolves in editor/managed controllers.
