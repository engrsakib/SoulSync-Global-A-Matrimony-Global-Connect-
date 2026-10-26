import { isAboutPageContentDto, type AboutPageContentDto } from '@soulsync/shared-types/about-page';
import { ensureRedisConnected, getRedisClient } from '@/lib/redis/client';
import { ABOUT_PAGE_REDIS_KEY, ABOUT_PAGE_REDIS_TTL_SECONDS } from './constants';

export async function readAboutPageFromRedis(): Promise<AboutPageContentDto | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }
  if (!(await ensureRedisConnected(redis))) {
    return null;
  }
  try {
    const raw = await redis.get(ABOUT_PAGE_REDIS_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isAboutPageContentDto(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeAboutPageToRedis(content: AboutPageContentDto): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }
  if (!(await ensureRedisConnected(redis))) {
    return;
  }
  try {
    await redis.setex(ABOUT_PAGE_REDIS_KEY, ABOUT_PAGE_REDIS_TTL_SECONDS, JSON.stringify(content));
  } catch {
    /* degrade gracefully */
  }
}
