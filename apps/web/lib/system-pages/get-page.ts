import { cache } from 'react';
import { isSystemPageDto, unwrapApiPayload, type SystemPageDto } from '@soulsync/shared-types';
import { isSystemPageSlug } from './constants';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

async function fetchSystemPage(slug: string): Promise<SystemPageDto | null> {
  try {
    const response = await fetch(`${apiBaseUrl}/public/system-pages/${encodeURIComponent(slug)}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 300 },
    });
    if (!response.ok) {
      return null;
    }
    const raw: unknown = await response.json();
    const payload = unwrapApiPayload<SystemPageDto>(raw);
    return isSystemPageDto(payload) ? payload : null;
  } catch {
    return null;
  }
}

export const getSystemPage = cache(async (slug: string): Promise<SystemPageDto | null> => {
  if (!isSystemPageSlug(slug)) {
    return null;
  }
  return fetchSystemPage(slug);
});
