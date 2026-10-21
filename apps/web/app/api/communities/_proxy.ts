import { NextResponse } from 'next/server';
import {
  proxyAuthGetWithToken,
  proxyAuthPatch,
  proxyAuthPostJson,
} from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';
import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export async function requireCommunitiesToken(): Promise<
  { token: string } | NextResponse
> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  return { token };
}

export async function proxyCommunitiesGet<T>(path: string, token: string): Promise<T> {
  return proxyAuthGetWithToken<T>(path, token);
}

export async function proxyCommunitiesGetWithQuery<T>(
  path: string,
  token: string,
  query: Record<string, string | undefined>,
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, value);
    }
  }
  const qs = params.toString();
  const fullPath = qs ? `${path}?${qs}` : path;
  return proxyAuthGetWithToken<T>(fullPath, token);
}

export async function proxyCommunitiesPost<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  return proxyAuthPostJson<T>(path, body, token);
}

export async function proxyCommunitiesPatch<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  return proxyAuthPatch<T>(path, body, token);
}

export async function proxyCommunitiesPut<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Request failed (${response.status})`));
  }
  return unwrapApiPayload<T>(raw);
}

export async function proxyCommunitiesDelete<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Request failed (${response.status})`));
  }
  return unwrapApiPayload<T>(raw);
}

export function communitiesErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : 'Request failed';
  return NextResponse.json({ message }, { status: 502 });
}

export function communityApiPath(slug: string, suffix = ''): string {
  return `/communities/${encodeURIComponent(slug)}${suffix}`;
}
