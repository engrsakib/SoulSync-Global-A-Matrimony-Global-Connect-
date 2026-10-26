import {
  isSubscriptionCatalogDto,
  type SubscriptionCatalogDto,
} from '@soulsync/shared-types/subscription-catalog';
import { ensureRedisConnected, getRedisClient } from '@/lib/redis/client';
import {
  SUBSCRIPTION_CATALOG_REDIS_KEY,
  SUBSCRIPTION_CATALOG_REDIS_TTL_SECONDS,
} from './constants';

export async function readSubscriptionCatalogFromRedis(): Promise<SubscriptionCatalogDto | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }
  if (!(await ensureRedisConnected(redis))) {
    return null;
  }
  try {
    const raw = await redis.get(SUBSCRIPTION_CATALOG_REDIS_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isSubscriptionCatalogDto(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeSubscriptionCatalogToRedis(
  catalog: SubscriptionCatalogDto,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }
  if (!(await ensureRedisConnected(redis))) {
    return;
  }
  try {
    await redis.setex(
      SUBSCRIPTION_CATALOG_REDIS_KEY,
      SUBSCRIPTION_CATALOG_REDIS_TTL_SECONDS,
      JSON.stringify(catalog),
    );
  } catch {
    /* degrade */
  }
}
