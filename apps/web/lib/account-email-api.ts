import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type { PublicUser } from '@/lib/auth-api';

async function accountEmailFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Request failed (${response.status})`));
  }

  return unwrapApiPayload<T>(raw);
}

export function requestSetAccountEmail(email: string): Promise<{ message: string }> {
  return accountEmailFetch('/api/account/email/set/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function confirmSetAccountEmail(email: string, code: string): Promise<PublicUser> {
  return accountEmailFetch<PublicUser>('/api/account/email/set/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export function requestChangeCurrentAccountEmail(): Promise<{ message: string }> {
  return accountEmailFetch('/api/account/email/change/request-current', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function verifyChangeCurrentAccountEmail(code: string): Promise<{ message: string }> {
  return accountEmailFetch('/api/account/email/change/verify-current', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function requestChangeNewAccountEmail(email: string): Promise<{ message: string }> {
  return accountEmailFetch('/api/account/email/change/request-new', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function confirmChangeNewAccountEmail(email: string, code: string): Promise<PublicUser> {
  return accountEmailFetch<PublicUser>('/api/account/email/change/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}
