# SoulSync Global

**Privacy-first, multi-tenant matrimony marketplace** — biodata profiles, discovery, communities, and encrypted messaging in a production-oriented **pnpm + Turborepo** monorepo.

<p align="center">
  <a href="https://github.com/engrsakib/SoulSync-Global-A-Matrimony-Global-Connect-"><img src="https://img.shields.io/badge/GitHub-Repository-181717?logo=github&logoColor=white" alt="GitHub Repository" /></a>
  <a href="https://github.com/engrsakib"><img src="https://img.shields.io/badge/Author-engrsakib-181717?logo=github&logoColor=white" alt="Author engrsakib" /></a>
  <img src="https://img.shields.io/badge/License-Private-lightgrey" alt="License Private" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white" alt="Node.js 24" />
  <img src="https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm&logoColor=white" alt="pnpm 12" />
</p>

<p align="center">
  <em>Monorepo · NestJS · Next.js · PostgreSQL · Redis · Web Crypto E2EE</em>
</p>

SoulSync Global is a **full-stack TypeScript** matrimony platform built for **tenant isolation**, **encrypted member data**, and **real-time messaging** without storing message plaintext on the server. The codebase demonstrates production patterns—BFF auth, Prisma migrations, Redis-backed realtime, OpenAPI, and CI—across three apps and shared packages in one Turborepo workspace.

## Contents

- [Technology stack](#technology-stack)
- [Core engineering highlights](#core-engineering-highlights)
- [Architecture](#architecture)
- [Monorepo layout](#monorepo-layout)
- [Repository](#repository)
- [Local setup (clone → Docker → run)](#local-setup-clone--docker--run)
- [Optional: local domains (Nginx)](#optional-local-domains-nginx)
- [Scripts (root)](#scripts-root)
- [Code quality and CI](#code-quality-and-ci)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Technology stack

Full-stack **TypeScript** monorepo: member-facing Next.js apps, NestJS API, shared packages, and Docker-backed data services for local development.

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Turborepo-EF4444?logo=turborepo&logoColor=white" alt="Turborepo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/GSAP-88CE02?logo=greensock&logoColor=black" alt="GSAP" />
  <img src="https://img.shields.io/badge/Socket.io-010101?logo=socketdotio&logoColor=white" alt="Socket.io" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/BullMQ-000000?logo=redis&logoColor=white" alt="BullMQ" />
  <img src="https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Zod-3B82F6?logo=zod&logoColor=white" alt="Zod" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white" alt="Redis" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Nginx-009639?logo=nginx&logoColor=white" alt="Nginx" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

| Layer | Tools |
| ----- | ----- |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, GSAP, Socket.io client, BFF routes under `/api` |
| **Backend** | NestJS 12, Socket.io gateway, BullMQ job queues, OpenAPI/Swagger, class-validator, Zod env |
| **Data** | PostgreSQL 16, Prisma ORM, Redis 7 (cache, presence, rate limits, Socket.io adapter) |
| **Security** | AES-256-GCM biodata at rest, browser Web Crypto E2EE messenger, JWT access/refresh/socket tickets, bcrypt, Helmet, throttling |
| **Platform** | pnpm workspaces, Turborepo, Husky + lint-staged, ESLint flat config, GitHub Actions CI |
| **Integrations** | Cloudinary (media), Nodemailer/SMTP (optional), Giphy (optional messenger GIF search) |

> TypeScript **6.0** is pinned (not TS 7) because NestJS relies on decorator metadata and the programmatic compiler API used by `@nestjs/cli`.

---

## Core engineering highlights

Designed for **data minimization on the server** and **defense in depth** on member-facing flows.

| Area | What it does |
| ---- | ------------ |
| **Biodata encryption at rest** | Sensitive profile strings encrypted with **AES-256-GCM** on the API; `enc:v1:` storage; master key only in `apps/api/.env` (`BIODATA_MASTER_KEY`). Plaintext enums/numbers kept for matching indexes. |
| **End-to-end encrypted messenger** | **Web Crypto** + IndexedDB key material; server stores ciphertext/nonces only; Socket.io realtime; safety numbers and identity-change handling. |
| **Protected biodata “resume” API** | Redacted member payloads for anti-scraping; per-viewer throttling; Redis audit counters (`GET /v1/profiles/:userId/resume`). |
| **Auth & sessions** | httpOnly session cookies via Next.js BFF; JWT refresh with single-flight retry; login-code pepper; block/restrict ties into biodata visibility and DMs. |
| **Compatibility scoring** | Viewer-centric **match %** (0–100) with eligibility gates and Redis-backed cache — shared scoring in `@soulsync/shared-types/compatibility`. |

**Key capabilities**

- Section-based biodata builder with partner preferences and visibility controls
- Discovery, communities, and feed ranking
- Viewer-centric compatibility scoring (match %)
- End-to-end encrypted dashboard messenger (Socket.io realtime)
- Subscription catalog with stub checkout flow
- Marriage registry and tenant admin backoffice

Deep dives: [`ai-knowledge/`](ai-knowledge/) (e.g. [`biodata-encryption.md`](ai-knowledge/biodata-encryption.md), [`messenger.md`](ai-knowledge/messenger.md), [`biodata-protection.md`](ai-knowledge/biodata-protection.md), [`compatibility-matching.md`](ai-knowledge/compatibility-matching.md)).

---

## Architecture

```mermaid
flowchart LR
  Web[Next.js_BFF]
  Admin[Admin_Next]
  API[NestJS_API]
  PG[(PostgreSQL)]
  Redis[(Redis)]
  Web --> API
  Admin --> API
  API --> PG
  API --> Redis
  Web -->|WebCrypto_E2EE| Browser[Browser_IDB]
  Web -->|Socket.io| API
```

**Docker Compose** runs **PostgreSQL** and **Redis** only. API, web, and admin run on the host via `pnpm dev` (see [Local setup](#local-setup-clone--docker--run)).

---

## Monorepo layout

| Path | Package | Port | Role |
| ---- | ------- | ---- | ---- |
| [`apps/web`](apps/web) | `@soulsync/web` | 3000 | Public site + member dashboard (Next.js App Router) |
| [`apps/admin`](apps/admin) | `@soulsync/admin` | 3001 | Backoffice |
| [`apps/api`](apps/api) | `@soulsync/api` | 4000 | REST + WebSocket API |
| [`packages/db`](packages/db) | `@soulsync/db` | — | Prisma schema, migrations, seed |
| [`packages/shared-types`](packages/shared-types) | `@soulsync/shared-types` | — | DTOs, compatibility scoring, messenger types |
| [`packages/ui`](packages/ui) | `@soulsync/ui` | — | Shared UI (Tailwind 4 + components) |
| [`packages/config`](packages/config) | `@soulsync/config` | — | ESLint, Prettier, TS configs |

```
.
├── apps/          api · web · admin
├── packages/      db · shared-types · ui · config
├── ai-knowledge/  internal architecture notes (for contributors)
├── docker-compose.yml
├── nginx/         optional local reverse proxy
└── turbo.json
```

---

## Repository

| | |
| --- | --- |
| **GitHub** | [engrsakib/SoulSync-Global-A-Matrimony-Global-Connect-](https://github.com/engrsakib/SoulSync-Global-A-Matrimony-Global-Connect-) |

```bash
git clone https://github.com/engrsakib/SoulSync-Global-A-Matrimony-Global-Connect-.git
cd SoulSync-Global-A-Matrimony-Global-Connect-
```

If you cloned into a different folder name (for example `"SoulSync Global"`), `cd` into that directory before running install and setup commands below.

---

## Local setup (clone → Docker → run)

### Prerequisites

- **Node.js** 24.22.1 — [`nvm use`](./.nvmrc) or install from [nodejs.org](https://nodejs.org/)
- **pnpm** 12.8.1 — `corepack enable && corepack prepare pnpm@12.8.1 --activate`
- **Docker Desktop** (PostgreSQL 16 + Redis 7)
- **Git**

### 1. Clone and install

```bash
git clone https://github.com/engrsakib/SoulSync-Global-A-Matrimony-Global-Connect-.git
cd SoulSync-Global-A-Matrimony-Global-Connect-
pnpm install
```

If pnpm asks to approve build scripts, run once:

```bash
pnpm approve-builds --all --yes
```

(`allowBuilds` is also declared in [`pnpm-workspace.yaml`](pnpm-workspace.yaml).)

### 2. Environment files

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

**Required for a working stack:**

| Variable | Where | Notes |
| -------- | ----- | ----- |
| `DATABASE_URL` | root `.env`, `apps/api/.env` | Default matches Compose: `postgresql://soulsync:soulsync_dev@localhost:5432/soulsync?schema=public` |
| `REDIS_URL` | same | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `apps/api/.env` | Min 16 characters each |
| `LOGIN_CODE_PEPPER` | `apps/api/.env` | Min 16 characters |
| `BIODATA_MASTER_KEY` | `apps/api/.env` | 32-byte key, base64url — generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env` | `http://localhost:4000/v1` |

**Optional:** SMTP (email verification), Cloudinary (uploads), `GIPHY_API_KEY` in `apps/api/.env` (messenger GIF search). See [`apps/api/.env.example`](apps/api/.env.example).

Set `DEFAULT_AUTH_TENANT_SLUG=demo` in `apps/api/.env` for local auth.

### 3. Start Docker (database + cache)

```bash
docker compose up -d postgres redis
docker compose ps
```

Wait until **postgres** and **redis** are healthy. The API, web, and admin processes are **not** containerized in this repo—they run via Node on your machine.

### 4. Database migrate and seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

For CI-style non-interactive apply: `pnpm db:deploy` instead of `db:migrate`.

### 5. Run applications

```bash
pnpm dev
```

Or individually:

```bash
pnpm --filter @soulsync/api dev
pnpm --filter @soulsync/web dev
pnpm --filter @soulsync/admin dev
```

Port conflict (`EADDRINUSE` on 3000, 3001, or 4000):

```bash
pnpm dev:restart
```

Turbo uses `--continue` so one app failing on a busy port does not block the others.

### 6. Verify

| URL | Purpose |
| --- | ------- |
| [http://localhost:3000](http://localhost:3000) | Web app |
| [http://localhost:3000/register](http://localhost:3000/register) | Register (email + password + login code) |
| [http://localhost:3000/login](http://localhost:3000/login) | Login |
| [http://localhost:3000/dashboard/messenger](http://localhost:3000/dashboard/messenger) | E2EE messenger (after login) |
| [http://localhost:3001](http://localhost:3001) | Admin |
| [http://localhost:4000/docs](http://localhost:4000/docs) | Swagger |
| [http://localhost:4000/v1/health/ready](http://localhost:4000/v1/health/ready) | API readiness |

### 7. First login (seed users)

After `pnpm db:seed`, the demo tenant includes:

| Account | Email | Password | Role |
| ------- | ----- | -------- | ---- |
| Tenant admin | `admin@soulsync.local` | `ChangeMe123!` | Tenant admin (login code printed in seed console) |
| Super admin | `super@soulsync.local` | `ChangeMe123!` | Super admin (subscription admin API) |

Change these passwords in any shared or public deployment.

---

## Optional: local domains (Nginx)

Add to your hosts file:

```
127.0.0.1 soulsync.local admin.soulsync.local api.soulsync.local
```

With dev servers running on ports 3000, 3001, and 4000:

```bash
docker compose --profile proxy up -d
```

| Host | Service |
| ---- | ------- |
| soulsync.local | Web |
| admin.soulsync.local | Admin |
| api.soulsync.local | API |

Config: [`nginx/nginx.conf`](nginx/nginx.conf).

---

## Scripts (root)

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | All apps in dev mode (Turbo, `--continue`) |
| `pnpm dev:restart` | Free ports 3000/3001/4000, then `pnpm dev` |
| `pnpm build` | Production build (`db:generate` + Turbo build) |
| `pnpm lint` | ESLint, zero warnings allowed |
| `pnpm typecheck` | TypeScript across workspace |
| `pnpm test` | Jest (API) and package tests |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm check:todos` | Fail on TODO/FIXME in repo |
| `pnpm db:generate` | Prisma client |
| `pnpm db:migrate` | Dev migrations |
| `pnpm db:deploy` | Apply migrations (deploy/CI) |
| `pnpm db:seed` | Demo tenant + users |
| `pnpm db:studio` | Prisma Studio |

---

## Code quality and CI

- **ESLint** — shared flat config via `@soulsync/config`; strict TypeScript on `.ts`/`.tsx`.
- **Prettier** — including Tailwind class sorting and Prisma plugin.
- **Husky** — pre-commit (`lint-staged`, TODO scan); commit-msg Conventional Commits.
- **GitHub Actions** — [`.github/workflows/ci.yml`](.github/workflows/ci.yml): install → `db:generate` → lint → typecheck → build (with Postgres/Redis services) → test.

---

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| Husky hooks not running (Windows) | `pnpm prepare`; ensure Git and pnpm on PATH |
| Ignored build scripts on install | `pnpm approve-builds --all --yes` |
| Prisma client missing | `pnpm db:generate` |
| Port in use | `pnpm dev:restart` or change `API_PORT` / Next ports in env |
| API root 404 | Use `/docs` or `/v1/health/ready`; confirm API process is running |
| Health `degraded` | Start Docker; check `DATABASE_URL` / `REDIS_URL`; run `pnpm db:migrate` |
| Web cannot resolve `@soulsync/ui` | `transpilePackages: ['@soulsync/ui']` in Next config (already set) |
| Empty tenant/plans on `/subscribe` | `pnpm db:deploy && pnpm db:seed`; check `NEXT_PUBLIC_API_URL` |
| Messenger Giphy empty | Set `GIPHY_API_KEY` in **`apps/api/.env`** (not web) |
| IDE slow on Windows | See [`ai-knowledge/dev-environment.md`](ai-knowledge/dev-environment.md) |

---

## License

Private — all rights reserved unless otherwise specified. Source is shared for portfolio and evaluation; redistribution or commercial use requires permission.

Maintained by [@engrsakib](https://github.com/engrsakib).
