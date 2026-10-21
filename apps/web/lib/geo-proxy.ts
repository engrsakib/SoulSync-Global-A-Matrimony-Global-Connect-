import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export async function proxyGeoGet<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    cache: 'no-store',
  });
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Geo request failed (${response.status})`));
  }
  return unwrapApiPayload<T>(raw);
}
