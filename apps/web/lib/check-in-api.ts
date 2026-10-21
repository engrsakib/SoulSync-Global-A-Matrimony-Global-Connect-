import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type { CheckInResultDto, CheckInStatusDto } from '@soulsync/shared-types/check-in';

async function checkInFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
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

export async function fetchCheckInStatus(): Promise<CheckInStatusDto> {
  return checkInFetch<CheckInStatusDto>('/api/check-in');
}

export async function performCheckIn(): Promise<CheckInResultDto> {
  return checkInFetch<CheckInResultDto>('/api/check-in', { method: 'POST' });
}
