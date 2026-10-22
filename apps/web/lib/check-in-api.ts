import { readApiErrorMessage } from '@soulsync/shared-types';
import type { CheckInResultDto, CheckInStatusDto } from '@soulsync/shared-types/check-in';
import { unwrapBffPayload } from '@/lib/bff-unwrap';

async function checkInFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

  return unwrapBffPayload<T>(raw);
}

export async function fetchCheckInStatus(): Promise<CheckInStatusDto> {
  return checkInFetch<CheckInStatusDto>('/api/check-in');
}

export async function performCheckIn(): Promise<CheckInResultDto> {
  return checkInFetch<CheckInResultDto>('/api/check-in', { method: 'POST' });
}
