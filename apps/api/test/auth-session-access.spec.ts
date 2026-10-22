import {
  isAuthSessionRowActive,
  parseJwtTtlSeconds,
  sessionCacheTtlSeconds,
  sessionValidityCacheKey,
  SESSION_CACHE_ACTIVE,
  SESSION_CACHE_INACTIVE,
} from '../src/auth/auth-session-access.util';

describe('auth-session-access.util', () => {
  const now = new Date('2026-01-01T12:00:00.000Z');
  const expiresAt = new Date('2026-01-08T12:00:00.000Z');

  it('builds stable cache keys', () => {
    expect(sessionValidityCacheKey('abc')).toBe('auth:sess:valid:abc');
  });

  it('parses JWT TTL strings', () => {
    expect(parseJwtTtlSeconds('2m')).toBe(120);
    expect(parseJwtTtlSeconds('7d')).toBe(7 * 86400);
  });

  it('caps session cache TTL by access TTL + buffer', () => {
    const futureExpiry = new Date(Date.now() + 7 * 86_400_000);
    const ttl = sessionCacheTtlSeconds(futureExpiry, 120);
    expect(ttl).toBe(180);
  });

  it('marks active session rows', () => {
    expect(
      isAuthSessionRowActive(
        { userId: 'u1', revokedAt: null, expiresAt },
        'u1',
        now,
      ),
    ).toBe(true);
  });

  it('rejects revoked, expired, wrong user, or missing session', () => {
    expect(isAuthSessionRowActive(null, 'u1', now)).toBe(false);
    expect(
      isAuthSessionRowActive(
        { userId: 'u2', revokedAt: null, expiresAt },
        'u1',
        now,
      ),
    ).toBe(false);
    expect(
      isAuthSessionRowActive(
        { userId: 'u1', revokedAt: now, expiresAt },
        'u1',
        now,
      ),
    ).toBe(false);
    expect(
      isAuthSessionRowActive(
        { userId: 'u1', revokedAt: null, expiresAt: new Date('2025-01-01') },
        'u1',
        now,
      ),
    ).toBe(false);
  });

  it('uses distinct cache sentinel values', () => {
    expect(SESSION_CACHE_ACTIVE).not.toBe(SESSION_CACHE_INACTIVE);
  });
});
