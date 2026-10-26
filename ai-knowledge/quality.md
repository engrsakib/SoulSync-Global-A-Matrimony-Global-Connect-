# Quality checks

Run these from the repo root for the package you changed:

```bash
pnpm --filter @soulsync/web lint
pnpm --filter @soulsync/web typecheck
pnpm --filter @soulsync/api lint
pnpm --filter @soulsync/api typecheck
pnpm --filter @soulsync/admin lint
pnpm --filter @soulsync/admin typecheck
```

`pnpm lint` and `pnpm typecheck` run the same tasks through Turborepo. Fix every reported error before ending a task. Do not leave unfinished-work markers. `scripts/check-todos.mjs` fails the commit when a staged file contains those markers.

## Pre-commit

`.husky/pre-commit` runs `pnpm exec lint-staged --max-arg-length 4000`.

`lint-staged.config.mjs` keeps each Prettier and ESLint command under 4000 characters. Windows `cmd.exe` rejects lines longer than 8191 characters, and the `.cmd` shim plus quoting can push a "safe" 8191-character list over that limit. The unfinished-work check runs once and reads the git index itself, so staged paths are not appended to that command.

## ESLint during commit

`lint-staged` starts at the repo root. One ESLint process can only use one flat config, so the hook groups staged files by the nearest `eslint.config.mjs` and passes that file with `--config`. A root file such as `lint-staged.config.mjs` has no config and is formatted only.

`apps/web/eslint.config.mjs` and `apps/admin/eslint.config.mjs` set `settings.next.rootDir` to the app directory so `@next/next/no-html-link-for-pages` finds each App Router tree when ESLint's working directory is the repo root.

`packages/db/eslint.config.mjs` applies `@soulsync/config/eslint/node-mjs` to `scripts/**/*.mjs` and `packages/db/scripts/**/*.mjs` so Node globals apply when ESLint runs from the repo root (lint-staged) or from `packages/db`. Do not ignore those paths; `--max-warnings=0` treats “ignored file” warnings as failures.

## Indexing and dev RAM

See [`dev-environment.md`](dev-environment.md) for `.cursorignore`, watcher excludes, Redis singleton in Next dev, and Turborepo lint vs typecheck.
