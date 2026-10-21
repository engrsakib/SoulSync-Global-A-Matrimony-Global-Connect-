import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadDotenv } from 'dotenv';

/** `apps/api` directory (works from `src/config` or `dist/config`). */
function resolveApiPackageRoot(): string {
  return join(__dirname, '../..');
}

/** Monorepo root (parent of `apps/`). */
function resolveRepoRootFromApi(): string {
  return join(resolveApiPackageRoot(), '..', '..');
}

/** Ordered env files: shared root first, then API overrides. */
export function resolveApiEnvFilePaths(): string[] {
  const paths: string[] = [];
  const repoRootEnv = join(resolveRepoRootFromApi(), '.env');
  const apiEnv = join(resolveApiPackageRoot(), '.env');

  if (existsSync(repoRootEnv)) {
    paths.push(repoRootEnv);
  }
  if (existsSync(apiEnv)) {
    paths.push(apiEnv);
  }

  return paths;
}

/** @deprecated Use resolveApiEnvFilePaths; kept for callers expecting a single path. */
export function resolveApiEnvFilePath(): string | undefined {
  const paths = resolveApiEnvFilePaths();
  return paths.at(-1);
}

/** Load root + API `.env` into `process.env` before Nest `ConfigModule` validates. */
export function loadApiEnvFile(): void {
  for (const path of resolveApiEnvFilePaths()) {
    loadDotenv({ path, override: true });
  }
}
