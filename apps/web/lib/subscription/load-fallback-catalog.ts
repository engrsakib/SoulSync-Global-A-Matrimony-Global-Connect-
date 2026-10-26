import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseSubscriptionCatalogDto,
  type SubscriptionCatalogDto,
} from '@soulsync/shared-types/subscription-catalog';

let cached: SubscriptionCatalogDto | null | undefined;

/** Written by `pnpm --filter @soulsync/db db:seed` — SSR fallback when API/cache miss. */
export function loadSubscriptionCatalogFallbackFromDisk(): SubscriptionCatalogDto | null {
  if (cached !== undefined) {
    return cached;
  }
  try {
    const path = resolve(
      process.cwd(),
      'packages/db/data/subscription-catalog-fallback.json',
    );
    const raw = readFileSync(path, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    cached = parseSubscriptionCatalogDto(parsed);
    return cached;
  } catch {
    try {
      const path = resolve(__dirname, '../../../../packages/db/data/subscription-catalog-fallback.json');
      const raw = readFileSync(path, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      cached = parseSubscriptionCatalogDto(parsed);
      return cached;
    } catch {
      cached = null;
      return null;
    }
  }
}
