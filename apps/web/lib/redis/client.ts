import Redis from 'ioredis';

const globalForRedis = globalThis as typeof globalThis & {
  __soulsyncRedis?: Redis | null;
  __soulsyncRedisUnavailableLogged?: boolean;
};

function createRedisClient(url: string): Redis {
  const redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  redis.on('error', () => {
    /* handled per call */
  });
  return redis;
}

export function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    if (!globalForRedis.__soulsyncRedisUnavailableLogged) {
      globalForRedis.__soulsyncRedisUnavailableLogged = true;
      console.warn('[redis] REDIS_URL is not set; Redis-backed features fall back to defaults.');
    }
    return null;
  }
  if (!globalForRedis.__soulsyncRedis) {
    globalForRedis.__soulsyncRedis = createRedisClient(url);
  }
  return globalForRedis.__soulsyncRedis;
}

export async function ensureRedisConnected(redis: Redis): Promise<boolean> {
  try {
    if (redis.status === 'wait' || redis.status === 'end') {
      await redis.connect();
    }
    return true;
  } catch {
    return false;
  }
}
