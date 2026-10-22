import type { PublicUser } from '@/lib/auth-api';
import type { UsernameAvailability } from '@/lib/auth-api';
import { bffFetch } from '@/lib/bff-fetch';

async function accountFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await bffFetch(path, init);

  const body = (await response.json().catch(() => ({}))) as T & { message?: string | string[] };

  if (!response.ok) {
    const message = body.message;
    const text = Array.isArray(message) ? message.join(', ') : (message ?? response.statusText);
    throw new Error(text || `Request failed (${response.status})`);
  }

  return body;
}

export function updateAccountProfile(payload: {
  firstName: string;
  lastName: string;
}): Promise<PublicUser> {
  return accountFetch<PublicUser>('/api/account/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateAccountUsername(payload: { username: string }): Promise<PublicUser> {
  return accountFetch<PublicUser>('/api/account/username', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateAccountPassword(payload: {
  newPassword: string;
  confirmPassword: string;
  currentPassword?: string;
}): Promise<PublicUser> {
  return accountFetch<PublicUser>('/api/account/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function uploadAccountAvatarFromUrl(url: string): Promise<PublicUser> {
  return accountFetch<PublicUser>('/api/account/avatar/from-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function uploadAccountAvatar(file: File): Promise<PublicUser> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await bffFetch('/api/account/avatar', {
    method: 'POST',
    body: formData,
  });

  const body = (await response.json().catch(() => ({}))) as PublicUser & {
    message?: string | string[];
  };

  if (!response.ok) {
    const message = body.message;
    const text = Array.isArray(message) ? message.join(', ') : (message ?? response.statusText);
    throw new Error(text || `Request failed (${response.status})`);
  }

  return body;
}

export function checkUsernameAvailableForAccount(username: string): Promise<UsernameAvailability> {
  const query = new URLSearchParams({ username });
  return accountFetch<UsernameAvailability>(`/api/account/username/available?${query.toString()}`, {
    method: 'GET',
    headers: {},
  });
}
