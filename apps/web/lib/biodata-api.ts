import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type { BiodataMeDto, BiodataSectionId } from '@soulsync/shared-types/biodata';

async function biodataFetch<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new Error(readApiErrorMessage(raw, `Biodata request failed (${response.status})`));
  }

  return unwrapApiPayload<T>(raw);
}

export async function fetchMyBiodata(): Promise<BiodataMeDto> {
  return biodataFetch<BiodataMeDto>('/api/biodata/me');
}

export async function patchBiodataSection(
  sectionId: BiodataSectionId,
  body: Record<string, unknown>,
): Promise<BiodataMeDto> {
  return biodataFetch<BiodataMeDto>(`/api/biodata/me/sections/${sectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type { BiodataMeDto, BiodataSectionId };
