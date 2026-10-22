import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type NestAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: unknown;
  loginCodePlain?: string;
};

export class AuthProxyHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthProxyHttpError';
  }
}

export async function proxyAuthPostJson<T>(
  path: string,
  body: unknown,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Auth request failed (${response.status})`));
  }

  return unwrapApiPayload<T>(raw);
}

export async function proxyAuthPost(path: string, body: unknown): Promise<NestAuthResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new AuthProxyHttpError(
      readApiErrorMessage(raw, `Auth request failed (${response.status})`),
      response.status,
    );
  }

  return unwrapApiPayload<NestAuthResponse>(raw);
}

export async function proxyAuthGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, { cache: 'no-store' });
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Auth request failed (${response.status})`));
  }
  return unwrapApiPayload<T>(raw);
}

export async function proxyAuthGetMe(accessToken: string): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error('Unauthorized');
  }
  return unwrapApiPayload(raw);
}

export async function proxyAuthGetWithToken<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Auth request failed (${response.status})`));
  }

  return unwrapApiPayload<T>(raw);
}

export async function proxyAuthPostMultipart<T>(
  path: string,
  formData: FormData,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
    cache: 'no-store',
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Upload failed (${response.status})`));
  }

  return unwrapApiPayload<T>(raw);
}

export async function proxyAuthPatch<T>(
  path: string,
  body: unknown,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Auth request failed (${response.status})`));
  }

  return unwrapApiPayload<T>(raw);
}

/** Rough max-age for access cookie from JWT_ACCESS_TTL env (default 2m). */
export function defaultAuthCookieMaxAge(): number {
  const ttl = process.env.JWT_ACCESS_TTL ?? '2m';
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
