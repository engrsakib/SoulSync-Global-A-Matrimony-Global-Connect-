export const AUTH_SESSION_CHANGED = 'soulsync:auth-changed';

export function notifyAuthSessionChanged(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED));
}
