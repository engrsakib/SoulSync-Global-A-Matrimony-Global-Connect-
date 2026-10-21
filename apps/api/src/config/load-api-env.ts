import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { config as loadDotenv } from 'dotenv';

/** Resolve `apps/api/.env` whether the process cwd is the repo root or `apps/api`. */
export function resolveApiEnvFilePath(): string | undefined {
  const candidates = [
    join(__dirname, '../../.env'),
    join(process.cwd(), '.env'),
    join(process.cwd(), 'apps/api/.env'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

/** Load API env file into `process.env` before Nest `ConfigModule` validates. */
export function loadApiEnvFile(): void {
  const path = resolveApiEnvFilePath();
  if (path) {
    loadDotenv({ path, override: false });
  }
}
