/** Redis cache entry: active session. */
export const SESSION_CACHE_ACTIVE = '1';
/** Redis cache entry: revoked, expired, or missing session. */
export const SESSION_CACHE_INACTIVE = '0';

export function sessionValidityCacheKey(sessionId: string): string {
  return `auth:sess:valid:${sessionId}`;
}

export function parseJwtTtlSeconds(ttl: string): number {
  const match = /^(\d+)([dhms])$/.exec(ttl.trim());
  if (!match) {
    return 120;
  }
  const value = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'd':
      return value * 86400;
    case 'h':
      return value * 3600;
    case 'm':
      return value * 60;
    default:
      return value;
  }
}

export function sessionCacheTtlSeconds(sessionExpiresAt: Date, accessTtlSeconds: number): number {
  const untilExpiry = Math.floor((sessionExpiresAt.getTime() - Date.now()) / 1000);
  const cap = accessTtlSeconds + 60;
  if (untilExpiry <= 0) {
    return 1;
  }
  return Math.min(untilExpiry, cap);
}

export function isAuthSessionRowActive(
  session: {
    userId: string;
    revokedAt: Date | null;
    expiresAt: Date;
  } | null,
  userId: string,
  now: Date = new Date(),
): boolean {
  if (!session) {
    return false;
  }
  if (session.userId !== userId) {
    return false;
  }
  if (session.revokedAt) {
    return false;
  }
  return session.expiresAt > now;
}
