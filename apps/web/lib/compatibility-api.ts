import type { ProfileCompatibilityDto } from '@soulsync/shared-types/compatibility';
import { readApiErrorMessage, unwrapBffPayload } from '@soulsync/shared-types';

async function compatibilityFetch<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-store' });
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Request failed (${response.status})`));
  }
  return unwrapBffPayload<T>(raw);
}

export function fetchMemberCompatibilityByUsername(
  username: string,
): Promise<ProfileCompatibilityDto> {
  return compatibilityFetch(
    `/api/biodata/members/${encodeURIComponent(username.trim().toLowerCase())}/compatibility`,
  );
}

export function fetchProfileCompatibility(targetUserId: string): Promise<ProfileCompatibilityDto> {
  return compatibilityFetch(`/api/profiles/${encodeURIComponent(targetUserId)}/compatibility`);
}
