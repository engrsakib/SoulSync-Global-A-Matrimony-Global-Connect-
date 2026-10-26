import type Redis from 'ioredis';

export type RedisCachedJsonOptions<T> = {
  cacheKey: string;
  lockKey: string;
  cacheTtlSeconds: number;
  lockTtlSeconds: number;
  waitMaxMs: number;
  parse: (raw: string) => T | null;
  load: () => Promise<T>;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getRedisCachedJson<T>(
  redis: Redis,
  options: RedisCachedJsonOptions<T>,
): Promise<T> {
  const cached = await redis.get(options.cacheKey);
  if (cached) {
    const parsed = options.parse(cached);
    if (parsed !== null) {
      return parsed;
    }
  }

  const lockResult = await redis.set(
    options.lockKey,
    '1',
    'EX',
    options.lockTtlSeconds,
    'NX',
  );

  if (lockResult === 'OK') {
    try {
      const freshCached = await redis.get(options.cacheKey);
      if (freshCached) {
        const parsed = options.parse(freshCached);
        if (parsed !== null) {
          return parsed;
        }
      }

      const loaded = await options.load();
      await redis.setex(options.cacheKey, options.cacheTtlSeconds, JSON.stringify(loaded));
      return loaded;
    } finally {
      await redis.del(options.lockKey).catch(() => undefined);
    }
  }

  const deadline = Date.now() + options.waitMaxMs;
  while (Date.now() < deadline) {
    await sleep(50 + Math.floor(Math.random() * 50));
    const waitingRaw = await redis.get(options.cacheKey);
    if (waitingRaw) {
      const parsed = options.parse(waitingRaw);
      if (parsed !== null) {
        return parsed;
      }
    }
  }

  const fallback = await options.load();
  await redis.setex(options.cacheKey, options.cacheTtlSeconds, JSON.stringify(fallback));
  return fallback;
}
