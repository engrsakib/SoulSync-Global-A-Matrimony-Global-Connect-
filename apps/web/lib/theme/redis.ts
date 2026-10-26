import {
  DEFAULT_THEME_PREFERENCE,
  THEME_REDIS_TTL_SECONDS,
  isThemePreference,
  type ThemePreference,
} from '@soulsync/shared-types/theme';
import { ensureRedisConnected, getRedisClient } from '@/lib/redis/client';
import { THEME_REDIS_KEY_PREFIX } from './constants';

function themeRedisKey(deviceId: string): string {
  return `${THEME_REDIS_KEY_PREFIX}${deviceId}`;
}

export async function readThemePreferenceFromRedis(
  deviceId: string,
): Promise<ThemePreference | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }
  if (!(await ensureRedisConnected(redis))) {
    return null;
  }
  try {
    const raw = await redis.get(themeRedisKey(deviceId));
    if (!raw) {
      return null;
    }
    return isThemePreference(raw) ? raw : null;
  } catch {
    return null;
  }
}

export async function writeThemePreferenceToRedis(
  deviceId: string,
  preference: ThemePreference,
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }
  if (!(await ensureRedisConnected(redis))) {
    return;
  }
  try {
    await redis.setex(themeRedisKey(deviceId), THEME_REDIS_TTL_SECONDS, preference);
  } catch {
    /* degrade gracefully */
  }
}

export async function resolveThemePreferenceWithRedis(deviceId: string): Promise<ThemePreference> {
  const fromRedis = await readThemePreferenceFromRedis(deviceId);
  return fromRedis ?? DEFAULT_THEME_PREFERENCE;
}
