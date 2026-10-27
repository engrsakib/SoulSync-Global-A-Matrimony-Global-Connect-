# Local dev environment (RAM and indexing)

**First-time clone, Docker, env, migrate, and run:** see the root [README.md](../README.md#local-setup-clone--docker--run).

## Cursor / IDE indexing

Root [`.cursorignore`](../.cursorignore) excludes build artifacts (`node_modules`, `.next`, `dist`, `.turbo`, `coverage`), Prisma generated client, logs, and vendored Prisma skill folders under `packages/db/.agents`, `.claude`, `.windsurf`. Reload Cursor after changing ignore rules.

[`.vscode/settings.json`](../.vscode/settings.json) adds matching `files.watcherExclude` / `search.exclude` to reduce file watcher load on Windows.

## Next.js dev (Redis)

[`apps/web/lib/redis/client.ts`](../apps/web/lib/redis/client.ts) keeps a single ioredis instance on `globalThis` so HMR does not spawn duplicate connections.

## Turborepo

`lint` does not depend on `^build` (see [`turbo.json`](../turbo.json)); `typecheck` still builds dependencies when `.d.ts` is required.

## Housekeeping

Before long dev sessions: `pnpm --filter @soulsync/api clean` and clear stale `.next` folders if disk or RAM is high. Full stack: `pnpm dev` (web + API + admin). Single app: `pnpm --filter @soulsync/web dev`.

## TypeScript imports

Prefer subpath imports from `@soulsync/shared-types/*` in new or touched files; use the root barrel only when importing many symbols from one module.
