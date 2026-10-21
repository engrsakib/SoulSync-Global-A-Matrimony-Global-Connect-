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

Successful Nest JSON responses use the standard envelope from `packages/shared-types/src/api-response` via `TransformResponseInterceptor`, except health success routes and handlers marked `@SkipResponseEnvelope()`. Errors always use the shared error envelope. See [api-responses.md](./api-responses.md).

Public pages use `apps/web/app/(public)/layout.tsx`. The site header in `apps/web/components/site-header.tsx` is `fixed` and `h-16` (64px). Page content is not automatically offset under that header.
