import Redis from 'ioredis';
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_REDIS_TTL_SECONDS,
  isThemePreference,
  type ThemePreference,
} from '@soulsync/shared-types/theme';
import { THEME_REDIS_KEY_PREFIX } from './constants';

let client: Redis | null = null;
let redisUnavailableLogged = false;

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    if (!redisUnavailableLogged) {
      redisUnavailableLogged = true;
      console.warn('[theme] REDIS_URL is not set; theme persistence falls back to cookies/default.');
    }
    return null;
  }
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    client.on('error', () => {
      /* handled per call */
    });
  }
  return client;
}

function themeRedisKey(deviceId: string): string {
  return `${THEME_REDIS_KEY_PREFIX}${deviceId}`;
}

async function ensureConnected(redis: Redis): Promise<boolean> {
  try {
    if (redis.status === 'wait' || redis.status === 'end') {
      await redis.connect();
    }
    return true;
  } catch {
    return false;
  }
}

export async function readThemePreferenceFromRedis(
  deviceId: string,
): Promise<ThemePreference | null> {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }
  if (!(await ensureConnected(redis))) {
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
  if (!(await ensureConnected(redis))) {
    return;
  }
  try {
    await redis.setex(themeRedisKey(deviceId), THEME_REDIS_TTL_SECONDS, preference);
  } catch {
    /* degrade gracefully */
  }
}

export async function resolveThemePreferenceWithRedis(
  deviceId: string,
): Promise<ThemePreference> {
  const fromRedis = await readThemePreferenceFromRedis(deviceId);
  return fromRedis ?? DEFAULT_THEME_PREFERENCE;
}
