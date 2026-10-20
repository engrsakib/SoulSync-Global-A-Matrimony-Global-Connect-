# SoulSync Global

Privacy-first, multi-tenant, multi-religious matrimony marketplace monorepo.

## Stack

- **Package manager:** pnpm workspaces
- **Build:** Turborepo
- **API:** NestJS 12 (`apps/api`) — OpenAPI at `/docs`
- **Web:** Next.js 16 App Router (`apps/web`)
- **Admin:** Next.js 16 App Router (`apps/admin`)
- **Database:** PostgreSQL 16 + Prisma 7 (`packages/db`)
- **Cache:** Redis 7

## Prerequisites

- Node.js >= 22.12 (see `.nvmrc`)
- pnpm 12.8+
- Docker (PostgreSQL + Redis)

## Quick start

```bash
pnpm install
# If install reports ignored build scripts, run: pnpm approve-builds --all
cp .env.example .env
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm dev
```

| App   | URL                         |
| ----- | --------------------------- |
| Web   | http://localhost:3000       |
| Admin | http://localhost:3001       |
| API   | http://localhost:4000/docs  |

## Local domains (optional Nginx)

Add to your hosts file:

```
127.0.0.1 soulsync.local admin.soulsync.local api.soulsync.local
```

Start the proxy profile:

```bash
docker compose --profile proxy up -d
```

| Host                    | Service |
| ----------------------- | ------- |
| soulsync.local          | Web     |
| admin.soulsync.local    | Admin   |
| api.soulsync.local      | API     |

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `pnpm dev`        | Run all apps in dev mode |
| `pnpm build`      | Production build         |
| `pnpm lint`       | ESLint (zero warnings)   |
| `pnpm typecheck`  | TypeScript check         |
| `pnpm test`       | Run tests                |
| `pnpm check:todos`| Scan for TODO/FIXME      |
| `pnpm db:generate`| Prisma generate          |
| `pnpm db:migrate` | Prisma migrate dev       |
| `pnpm db:seed`    | Seed database            |

## Workspace packages

- `@soulsync/config` — shared ESLint, Prettier, TypeScript configs
- `@soulsync/db` — Prisma schema and client
- `@soulsync/ui` — shared React UI components

## CI

GitHub Actions runs lint, typecheck, build, migration deploy, tests, and TODO/FIXME scanning on every push and pull request.
