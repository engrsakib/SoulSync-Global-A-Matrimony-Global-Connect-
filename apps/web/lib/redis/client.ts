import Redis from 'ioredis';

let client: Redis | null = null;
let redisUnavailableLogged = false;

export function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    if (!redisUnavailableLogged) {
      redisUnavailableLogged = true;
      console.warn('[redis] REDIS_URL is not set; Redis-backed features fall back to defaults.');
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
