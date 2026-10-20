const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type NestAuthResponse = {
  accessToken: string;
  user: unknown;
  loginCodePlain?: string;
};

export async function proxyAuthPost(
  path: string,
  body: unknown,
): Promise<NestAuthResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const data = (await response.json().catch(() => ({}))) as NestAuthResponse & {
    message?: string | string[];
  };

  if (!response.ok) {
    const message = data.message;
    const text = Array.isArray(message) ? message.join(', ') : message ?? response.statusText;
    throw new Error(text || `Auth request failed (${response.status})`);
  }

  return data;
}

export async function proxyAuthGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { cache: 'no-store' });
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
  };
  if (!response.ok) {
    const message = data.message;
    const text = Array.isArray(message) ? message.join(', ') : message ?? response.statusText;
    throw new Error(text || `Auth request failed (${response.status})`);
  }
  return data;
}

export async function proxyAuthGetMe(accessToken: string): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error('Unauthorized');
  }
  return data;
}

/** Rough max-age for cookie from JWT_ACCESS_TTL env (default 7d). */
export function defaultAuthCookieMaxAge(): number {
  const ttl = process.env.JWT_ACCESS_TTL ?? '7d';
  const match = /^(\d+)([dhms])$/.exec(ttl.trim());
  if (!match) {
    return 60 * 60 * 24 * 7;
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
