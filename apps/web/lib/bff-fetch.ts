import { readApiErrorMessage } from '@soulsync/shared-types';
import { redirectToLoginIfSessionExpired } from '@/lib/auth-session';

const REFRESH_PATH = '/api/auth/refresh';

let refreshInFlight: Promise<boolean> | null = null;

export type BffFetchOptions = RequestInit & {
  /** When true (default), 401 after failed refresh triggers login redirect on the client. */
  redirectOnSessionExpired?: boolean;
};

export class BffAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly sessionExpired: boolean,
  ) {
    super(message);
    this.name = 'BffAuthError';
  }
}

export function isBffAuthRefreshExcluded(url: string): boolean {
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : (url.split('?')[0] ?? url);
    return (
      path.includes('/api/auth/refresh') ||
      path.includes('/api/auth/login') ||
      path.includes('/api/auth/register') ||
      path.includes('/api/auth/guest') ||
      path.includes('/api/auth/logout') ||
      path.includes('/api/auth/forgot-password')
    );
  } catch {
    return url.includes('/api/auth/refresh');
  }
}

async function refreshSessionOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(REFRESH_PATH, {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function mergeHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers);
  const body = init?.body;
  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function resolveUrl(input: RequestInfo | URL): string {
  return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
}

/**
 * Browser fetch to same-origin BFF routes with cookies.
 * On 401, attempts one session refresh via POST /api/auth/refresh and retries once.
 */
export async function bffFetch(
  input: RequestInfo | URL,
  init?: BffFetchOptions,
): Promise<Response> {
  const { redirectOnSessionExpired = true, ...fetchInit } = init ?? {};
  const url = resolveUrl(input);

  const baseInit: RequestInit = {
    ...fetchInit,
    credentials: 'include',
    cache: 'no-store',
    headers: mergeHeaders(fetchInit),
  };

  let response = await fetch(input, baseInit);

  if (response.status === 401 && !isBffAuthRefreshExcluded(url)) {
    const refreshed = await refreshSessionOnce();
    if (refreshed) {
      response = await fetch(input, baseInit);
    }
  }

  if (response.status === 401 && redirectOnSessionExpired && !isBffAuthRefreshExcluded(url)) {
    redirectToLoginIfSessionExpired();
  }

  return response;
}

/** bffFetch + JSON body; throws {@link BffAuthError} on non-OK responses. */
export async function bffJsonFetch<T>(
  input: RequestInfo | URL,
  init?: BffFetchOptions,
  fallbackMessage = 'Request failed',
): Promise<T> {
  const url = resolveUrl(input);
  const response = await bffFetch(input, init);
  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = readApiErrorMessage(raw, `${fallbackMessage} (${response.status})`);
    const sessionExpired =
      response.status === 401 &&
      !isBffAuthRefreshExcluded(url) &&
      typeof raw === 'object' &&
      raw !== null &&
      (raw as { code?: string }).code === 'SESSION_EXPIRED';
    throw new BffAuthError(message, response.status, sessionExpired);
  }

  return raw as T;
}
