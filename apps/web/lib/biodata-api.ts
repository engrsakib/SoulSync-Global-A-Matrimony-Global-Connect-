import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type { BiodataMeDto, BiodataSectionId } from '@soulsync/shared-types/biodata';

export function biodataManagedBasePath(managedOwnerUserId?: string | null): string {
  if (managedOwnerUserId) {
    return `/api/biodata/managed/${encodeURIComponent(managedOwnerUserId)}`;
  }
  return '/api/biodata/me';
}

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

export async function fetchMyBiodata(managedOwnerUserId?: string | null): Promise<BiodataMeDto> {
  const base = biodataManagedBasePath(managedOwnerUserId);
  const path = managedOwnerUserId ? `${base}/me` : base;
  return biodataFetch<BiodataMeDto>(path);
}

export async function patchBiodataSection(
  sectionId: BiodataSectionId,
  body: Record<string, unknown>,
  managedOwnerUserId?: string | null,
): Promise<BiodataMeDto> {
  const base = biodataManagedBasePath(managedOwnerUserId);
  return biodataFetch<BiodataMeDto>(`${base}/sections/${sectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export type { BiodataMeDto, BiodataSectionId };
