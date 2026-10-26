import { unwrapApiPayload } from '@soulsync/shared-types';
import {
  isSubscriptionCatalogDto,
  type SubscriptionCatalogDto,
} from '@soulsync/shared-types/subscription-catalog';
import { readSubscriptionCatalogFromRedis, writeSubscriptionCatalogToRedis } from './redis';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

const EMPTY_CATALOG: SubscriptionCatalogDto = {
  page: {
    badge: 'Pricing',
    title: 'Subscription plans',
    description: 'Choose the right plan for your biodata journey.',
    yearlySaveLabel: 'Save 30%',
  },
  plans: [],
  featuredPlanSlug: null,
};

async function fetchCatalogFromApi(): Promise<SubscriptionCatalogDto | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/subscriptions/catalog`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      return null;
    }
    const raw: unknown = await response.json();
    const payload = unwrapApiPayload<unknown>(raw);
    return isSubscriptionCatalogDto(payload) ? payload : null;
  } catch {
    return null;
  }
}

export async function getSubscriptionCatalog(): Promise<SubscriptionCatalogDto> {
  const fromRedis = await readSubscriptionCatalogFromRedis();
  if (fromRedis) {
    return fromRedis;
  }

  const fromApi = await fetchCatalogFromApi();
  if (fromApi) {
    await writeSubscriptionCatalogToRedis(fromApi);
    return fromApi;
  }

  return EMPTY_CATALOG;
}
