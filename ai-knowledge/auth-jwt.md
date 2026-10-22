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

[`JwtAuthGuard`](../apps/api/src/auth/jwt-auth.guard.ts) accepts **access** tokens only.

## Web

| Cookie  | Name         | Content                                    |
| ------- | ------------ | ------------------------------------------ |
| Access  | `ss_access`  | Bearer access JWT                          |
| Refresh | `ss_refresh` | Refresh JWT (not sent to biodata upstream) |

- Auth BFF: login/register/guest set both cookies; [`POST /api/auth/refresh`](../apps/web/app/api/auth/refresh/route.ts) exchanges refresh for a new pair; logout clears both.
- SSR/BFF: [`getValidAccessTokenFromCookies()`](../apps/web/lib/auth-cookie.ts) uses a fresh access token or calls Nest refresh in-memory for that request when access is expired.
- Client: [`auth-api.ts`](../apps/web/lib/auth-api.ts) retries once on 401 via `/api/auth/refresh`.
- Middleware: protected routes allow `ss_access` **or** `ss_refresh` so expired access does not force login before refresh.

## Module note

[`BiodataEditorModule`](../apps/api/src/biodata-editor/biodata-editor.module.ts) imports [`AuthModule`](../apps/api/src/auth/auth.module.ts) so `JwtAuthGuard` resolves in editor/managed controllers.
