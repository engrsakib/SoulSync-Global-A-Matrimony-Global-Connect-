export type PublicUser = {
  id: string;
  email: string | null;
  hasVerifiedEmail: boolean;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  isGuest: boolean;
  role: string;
  status: string;
  hasPassword: boolean;
  avatarUrl: string | null;
};

export type AuthResponse = {
  user: PublicUser;
  loginCodePlain?: string;
};

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => ({}))) as T & { message?: string | string[] };

  if (!response.ok) {
    const message = body.message;
    const text = Array.isArray(message) ? message.join(', ') : (message ?? response.statusText);
    throw new Error(text || `Request failed (${response.status})`);
  }

  return body;
}

export function registerAccount(payload: {
  email: string;
  username: string;
  password: string;
}): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginAccount(payload: {
  identifier: string;
  password: string;
}): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createGuestAccount(): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/guest', { method: 'POST' });
}

export function guestLogin(loginCode: string): Promise<AuthResponse> {
  return authFetch<AuthResponse>('/api/auth/guest/login', {
    method: 'POST',
    body: JSON.stringify({ loginCode }),
  });
}

export function fetchCurrentUser(): Promise<PublicUser> {
  return authFetch<PublicUser>('/api/auth/me');
}

export function logoutSession(): Promise<{ ok: boolean }> {
  return authFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export type UsernameAvailability = {
  username: string;
  available: boolean;
  valid: boolean;
};

export function checkUsernameAvailable(username: string): Promise<UsernameAvailability> {
  const query = new URLSearchParams({ username });
  return authFetch<UsernameAvailability>(`/api/auth/username/available?${query.toString()}`, {
    method: 'GET',
    headers: {},
  });
}
