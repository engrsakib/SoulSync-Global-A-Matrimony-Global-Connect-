# SoulSync Global

Production-oriented **pnpm workspace + Turborepo** monorepo for a privacy-first, multi-tenant, multi-religious matrimony marketplace.

| Package / app     | Name               | Port | Description                                      |
| ----------------- | ------------------ | ---- | ------------------------------------------------ |
| `apps/api`        | `@soulsync/api`    | 4000 | NestJS REST API (Swagger, Prisma, Redis)         |
| `apps/web`        | `@soulsync/web`    | 3000 | Public marketplace (Next.js App Router)          |
| `apps/admin`      | `@soulsync/admin`  | 3001 | Backoffice administration panel                  |
| `packages/db`     | `@soulsync/db`     | —    | Prisma schema, client, migrations, seed          |
| `packages/ui`     | `@soulsync/ui`     | —    | Shared UI (Tailwind 4 + shadcn-style components) |
| `packages/config` | `@soulsync/config` | —    | Shared ESLint, Prettier, TypeScript configs      |

## Prerequisites

- **Node.js** 24.22.1 (see [`.nvmrc`](./.nvmrc); `nvm install` / `nvm use`)
- **pnpm** 12 (`corepack enable && corepack prepare pnpm@12.8.1 --activate`)
- **Docker Desktop** (PostgreSQL 16 + Redis 7 via Compose)
- **Nginx** (optional, local reverse proxy via Compose `proxy` profile)

> **TypeScript 6.0** is used instead of TypeScript 7 because NestJS relies on the programmatic TypeScript compiler API and `emitDecoratorMetadata`, which are not fully supported on the TS 7 toolchain used by `@nestjs/cli`.

## Repository structure

```
.
├── .github/workflows/ci.yml
├── .husky/
├── apps/
│   ├── api/
│   ├── web/
│   └── admin/
├── packages/
│   ├── config/
│   ├── db/
│   └── ui/
├── docker-compose.yml
├── nginx/nginx.conf
├── scripts/check-todos.mjs
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Step-by-step local setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd "SoulSync Global"
pnpm install
```

On first install, pnpm may require approving dependency build scripts. The repo commits `allowBuilds` in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml); if your pnpm version still prompts, run `pnpm approve-builds --all --yes` once locally.

### 2. Environment files

Copy example env files and adjust secrets for local use:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

Ensure `DATABASE_URL` and `REDIS_URL` in root `.env` and `apps/api/.env` match Docker Compose defaults:

- Postgres: `postgresql://soulsync:soulsync_dev@localhost:5432/soulsync?schema=public`
- Redis: `redis://localhost:6379`

### 3. Start infrastructure

```bash
docker compose up -d postgres redis
docker compose ps   # optional — wait until postgres and redis are healthy
```

### 4. Database migrate and seed

```bash
pnpm db:generate
pnpm db:migrate    # creates/applies migrations (interactive name on first run)
pnpm db:seed       # demo tenant + admin user
```

### 5. Run all applications

```bash
pnpm dev
```

Or run individually:

```bash
pnpm --filter @soulsync/api dev
pnpm --filter @soulsync/web dev
pnpm --filter @soulsync/admin dev
```

### Auth (web + API)

After migrate/seed, set in `apps/api/.env` (see `apps/api/.env.example`):

- `JWT_SECRET`, `JWT_ACCESS_TTL`, `BCRYPT_ROUNDS` (default `10`)
- `DEFAULT_AUTH_TENANT_SLUG=demo`
- `LOGIN_CODE_PEPPER` (min 16 characters; falls back to `JWT_SECRET` in dev if omitted)

Web auth uses Next.js BFF routes under `/api/auth/*` and an httpOnly `ss_access` cookie. Try:

- [http://localhost:3000/register](http://localhost:3000/register) — email, username, password + login code reveal
- [http://localhost:3000/login](http://localhost:3000/login) — account login or guest code (create / sign in)

Verify:

- API root: [http://localhost:4000/](http://localhost:4000/) (service links)
- API health (ready): [http://localhost:4000/v1/health/ready](http://localhost:4000/v1/health/ready)
- Swagger: [http://localhost:4000/docs](http://localhost:4000/docs)

If dev fails with `EADDRINUSE` on 3000, 3001, or 4000, stale Node processes are usually still listening. Run `pnpm dev:restart` to free those ports and start again, or start only what is missing (often the API: `pnpm --filter @soulsync/api dev`). Root `pnpm dev` uses Turbo `--continue` so the API can still start when web/admin ports are already in use.

- Web: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3001](http://localhost:3001)

## Local domains (optional Nginx)

Add to your hosts file:

```
127.0.0.1 soulsync.local admin.soulsync.local api.soulsync.local
```

Start the proxy profile (expects dev servers on host ports 3000, 3001, 4000):

```bash
docker compose --profile proxy up -d
```

| Host                 | Service |
| -------------------- | ------- |
| soulsync.local       | Web     |
| admin.soulsync.local | Admin   |
| api.soulsync.local   | API     |

Configuration: [`nginx/nginx.conf`](./nginx/nginx.conf).

## Scripts (root)

| Script              | Description                                |
| ------------------- | ------------------------------------------ |
| `pnpm dev`          | All apps in dev mode (Turbo, `--continue`) |
| `pnpm dev:restart`  | Kill ports 3000/3001/4000, then `pnpm dev` |
| `pnpm build`        | Production build (cached)                  |
| `pnpm lint`         | ESLint, zero warnings allowed              |
| `pnpm typecheck`    | TypeScript across workspace                |
| `pnpm test`         | Jest (API) and package tests               |
| `pnpm format`       | Prettier write                             |
| `pnpm format:check` | Prettier check                             |
| `pnpm check:todos`  | Fail if TODO/FIXME comments exist          |
| `pnpm db:*`         | Prisma generate / migrate / seed / studio  |

## Code quality gates

- **ESLint** (flat config via `@soulsync/config`): strict TypeScript rules on `.ts`/`.tsx`, Turbo env-var checks.
- **Prettier** for formatting (including Tailwind class sorting).
- **Husky** `pre-commit`: `lint-staged` (ESLint + Prettier on staged files, TODO/FIXME scan).
- **Husky** `commit-msg`: [Conventional Commits](https://www.conventionalcommits.org/) pattern (`feat:`, `fix:`, `chore:`, …).

Commits are **blocked** if lint, format (on staged files), staged TODO/FIXME markers, or commit message rules fail.

## CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

On push/PR to `main`:

**Quality job**

1. `pnpm install --frozen-lockfile`
2. `pnpm turbo run db:generate`
3. `pnpm turbo run lint`
4. `pnpm turbo run typecheck`
5. `pnpm check:todos`
6. `pnpm prisma validate` (`@soulsync/db`)

**Build job** (with Postgres + Redis services)

1. `pnpm turbo run build`
2. `pnpm db:deploy`
3. `pnpm turbo run test`

Recommended: enable branch protection requiring both jobs before merge.

## Adding a new package or app

1. Create under `packages/` or `apps/` with name `@soulsync/<name>`.
2. Extend `@soulsync/config` TypeScript and ESLint presets.
3. Add `lint`, `typecheck`, and `build`/`dev` scripts for Turbo.
4. Declare workspace dependencies with `"workspace:*"`.
5. Run `pnpm install` from the repo root.

## Troubleshooting

| Issue                                 | Fix                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Husky hooks not running on Windows    | Run `pnpm prepare`; ensure Git and `pnpm` are on PATH                                                |
| Ignored build scripts on install      | Run `pnpm approve-builds --all --yes`; confirm `allowBuilds` in `pnpm-workspace.yaml`                |
| Prisma client missing                 | Run `pnpm db:generate` from root                                                                     |
| Port already in use (`EADDRINUSE`)    | Run `npx kill-port 4000` (or change `API_PORT` in `apps/api/.env`)                                   |
| `http://localhost:4000/` 404          | Use `/docs` or `/v1/health`; ensure API process started (not stuck after port conflict)              |
| API health `degraded`                 | Confirm Docker is up, credentials match `.env`, run `pnpm db:migrate`                                |
| Next cannot resolve `@soulsync/ui`    | Ensure `transpilePackages: ['@soulsync/ui']` in `next.config.ts`                                     |
| Web/admin empty tenant list           | Start API and seed: `pnpm db:seed`; check `NEXT_PUBLIC_API_URL` points to `http://localhost:4000/v1` |
| ESLint project service slow first run | Normal on first lint; subsequent runs use cache                                                      |

## License

Private — all rights reserved unless otherwise specified.
