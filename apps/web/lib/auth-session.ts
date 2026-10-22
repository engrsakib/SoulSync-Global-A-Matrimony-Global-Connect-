export const AUTH_SESSION_CHANGED = 'soulsync:auth-changed';

const SESSION_REDIRECT_FLAG = 'soulsync:session-redirect';

export function notifyAuthSessionChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED));
}

/** Client-only: navigate to login once when refresh cannot restore the session. */
export function redirectToLoginIfSessionExpired(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const path = window.location.pathname;
  if (path.startsWith('/login')) {
    return;
  }
  try {
    if (sessionStorage.getItem(SESSION_REDIRECT_FLAG) === '1') {
      return;
    }
    sessionStorage.setItem(SESSION_REDIRECT_FLAG, '1');
  } catch {
    /* sessionStorage unavailable */
  }
  const next = `${path}${window.location.search}`;
  const params = new URLSearchParams({ reason: 'session_expired', next });
  const loginUrl = `/login?${params.toString()}`;
  // Hard navigation after failed silent refresh (outside React event handlers).
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload clears stale client state
  window.location.assign(loginUrl);
}

/** Call after successful login to allow future session-expired redirects. */
export function clearSessionExpiredRedirectFlag(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(SESSION_REDIRECT_FLAG);
  } catch {
    /* ignore */
  }
}
