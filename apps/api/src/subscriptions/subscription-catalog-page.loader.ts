import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SubscriptionCatalogPageDto } from '@soulsync/shared-types/subscription-catalog';

let cached: SubscriptionCatalogPageDto | null = null;

export function loadSubscriptionCatalogPage(): SubscriptionCatalogPageDto {
  if (cached) {
    return cached;
  }
  const path = resolve(__dirname, '../../../../packages/db/data/subscription-catalog-page.json');
  const raw = readFileSync(path, 'utf8');
  cached = JSON.parse(raw) as SubscriptionCatalogPageDto;
  return cached;
}
