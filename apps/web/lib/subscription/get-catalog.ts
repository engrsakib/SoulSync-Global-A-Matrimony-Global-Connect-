import { unwrapApiPayload } from '@soulsync/shared-types';
import {
  parseSubscriptionCatalogDto,
  type SubscriptionCatalogDto,
} from '@soulsync/shared-types/subscription-catalog';
import { loadSubscriptionCatalogFallbackFromDisk } from './load-fallback-catalog';
import { readSubscriptionCatalogFromRedis, writeSubscriptionCatalogToRedis } from './redis';
import { resolveSubscriptionApiBaseUrl } from './resolve-api-base-url';

function hasPlans(catalog: SubscriptionCatalogDto): boolean {
  return catalog.plans.length > 0;
}

function mergeWithFallback(
  primary: SubscriptionCatalogDto | null,
  fallback: SubscriptionCatalogDto | null,
): SubscriptionCatalogDto | null {
  if (primary && hasPlans(primary)) {
    return primary;
  }
  if (fallback && hasPlans(fallback)) {
    return {
      ...fallback,
      page: primary?.page ?? fallback.page,
    };
  }
  return primary ?? fallback;
}

async function fetchCatalogFromApi(): Promise<SubscriptionCatalogDto | null> {
  const apiBaseUrl = resolveSubscriptionApiBaseUrl();
  try {
    const response = await fetch(`${apiBaseUrl}/subscriptions/catalog`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    const raw: unknown = await response.json();
    const payload = unwrapApiPayload<unknown>(raw);
    return parseSubscriptionCatalogDto(payload);
  } catch {
    return null;
  }
}

export async function getSubscriptionCatalog(): Promise<SubscriptionCatalogDto> {
  const fallback = loadSubscriptionCatalogFallbackFromDisk();

  const fromRedis = await readSubscriptionCatalogFromRedis();
  const redisCatalog = mergeWithFallback(fromRedis, fallback);
  if (redisCatalog && hasPlans(redisCatalog)) {
    return redisCatalog;
  }

  const fromApi = await fetchCatalogFromApi();
  const resolved = mergeWithFallback(fromApi, fallback);
  if (resolved && hasPlans(resolved)) {
    await writeSubscriptionCatalogToRedis(resolved);
    return resolved;
  }

  if (resolved) {
    return resolved;
  }

  return (
    fallback ?? {
      page: {
        badge: 'Pricing',
        title: 'Spark, Velocity & Nexus',
        description:
          'Choose monthly (30-day) or yearly (365-day) access—upgrade anytime as your search evolves.',
        yearlySaveLabel: 'Save ~50%',
      },
      plans: [],
      featuredPlanSlug: null,
    }
  );
}
