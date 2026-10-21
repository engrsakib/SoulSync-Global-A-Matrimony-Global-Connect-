# Architecture

pnpm workspace and Turborepo. TypeScript 6.0 is intentional: NestJS still needs the TypeScript 6 compiler API.

| Path                    | Package                  | Port | Role                                               |
| ----------------------- | ------------------------ | ---- | -------------------------------------------------- |
| `apps/api`              | `@soulsync/api`          | 4000 | NestJS REST API, Swagger at `/docs`, Prisma, Redis |
| `apps/web`              | `@soulsync/web`          | 3000 | Public Next.js App Router site                     |
| `apps/admin`            | `@soulsync/admin`        | 3001 | Backoffice Next.js app                             |
| `packages/db`           | `@soulsync/db`           | —    | Prisma schema, client, migrations, seed            |
| `packages/ui`           | `@soulsync/ui`           | —    | Shared Tailwind 4 UI                               |
| `packages/shared-types` | `@soulsync/shared-types` | —    | Types shared by API and apps                       |
| `packages/config`       | `@soulsync/config`       | —    | Shared ESLint, Prettier, and TypeScript configs    |

Local infrastructure is Docker Compose: PostgreSQL 16 and Redis 7. Web auth is a Next.js BFF under `apps/web/app/api/auth/*` with an httpOnly `ss_access` cookie. The API auth module lives in `apps/api/src/auth`.

## Local dev servers

| Command                           | Purpose                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                        | Turbo runs web (3000), admin (3001), and API (4000). Uses `--continue` so one port conflict does not stop the other apps from starting. |
| `pnpm dev:restart`                | Runs `scripts/kill-dev-ports.mjs` (3000, 3001, 4000) then `pnpm dev`. Use when `EADDRINUSE` or stale Node processes block ports.        |
| `pnpm --filter @soulsync/api dev` | API only — use when web/admin are already running but biodata/auth calls fail (API on 4000 was never started).                          |

If `pnpm dev` prints `EADDRINUSE` on 3000 or 3001, an old Next dev server is usually still running; either use `pnpm dev:restart` or start only the missing app (often the API).

Successful Nest JSON responses use the standard envelope from `packages/shared-types/src/api-response` via `TransformResponseInterceptor`, except health success routes and handlers marked `@SkipResponseEnvelope()`. Errors always use the shared error envelope. See [api-responses.md](./api-responses.md).

Public pages use `apps/web/app/(public)/layout.tsx`. The site header in `apps/web/components/site-header.tsx` is `fixed` and `h-16` (64px). Page content is not automatically offset under that header.
