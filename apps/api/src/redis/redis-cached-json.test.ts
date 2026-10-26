import { getRedisCachedJson } from './redis-cached-json';

type FakeRedisState = {
  kv: Map<string, string>;
  loadCalls: number;
};

function createFakeRedis(state: FakeRedisState) {
  return {
    get: jest.fn(async (key: string) => state.kv.get(key) ?? null),
    set: jest.fn(async (key: string, value: string, exMode: string, ex: number, nx: string) => {
      if (nx === 'NX' && state.kv.has(key)) {
        return null;
      }
      if (exMode === 'EX') {
        state.kv.set(key, value);
        return 'OK';
      }
      return 'OK';
    }),
    setex: jest.fn(async (key: string, _ttl: number, value: string) => {
      state.kv.set(key, value);
      return 'OK';
    }),
    del: jest.fn(async (key: string) => {
      state.kv.delete(key);
      return 1;
    }),
  };
}

describe('getRedisCachedJson', () => {
  it('coalesces concurrent cache misses to a single loader call', async () => {
    const state: FakeRedisState = { kv: new Map(), loadCalls: 0 };
    const redis = createFakeRedis(state);

    const options = {
      cacheKey: 'cache:test',
      lockKey: 'lock:test',
      cacheTtlSeconds: 86400,
      lockTtlSeconds: 30,
      waitMaxMs: 2000,
      parse: (raw: string) => JSON.parse(raw) as { value: number },
      load: async () => {
        state.loadCalls += 1;
        await new Promise((r) => setTimeout(r, 40));
        return { value: 42 };
      },
    };

    const [a, b] = await Promise.all([
      getRedisCachedJson(redis as never, options),
      getRedisCachedJson(redis as never, options),
    ]);

    expect(a).toEqual({ value: 42 });
    expect(b).toEqual({ value: 42 });
    expect(state.loadCalls).toBe(1);
  });
});
