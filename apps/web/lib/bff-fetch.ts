const REFRESH_PATH = '/api/auth/refresh';

let refreshInFlight: Promise<boolean> | null = null;

export function isBffAuthRefreshExcluded(url: string): boolean {
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url.split('?')[0] ?? url;
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

/**
 * Browser fetch to same-origin BFF routes with cookies.
 * On 401, attempts one session refresh via POST /api/auth/refresh and retries once.
 */
export async function bffFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

  const baseInit: RequestInit = {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: mergeHeaders(init),
  };

  let response = await fetch(input, baseInit);

  if (response.status === 401 && !isBffAuthRefreshExcluded(url)) {
    const refreshed = await refreshSessionOnce();
    if (refreshed) {
      response = await fetch(input, baseInit);
    }
  }

  return response;
}
