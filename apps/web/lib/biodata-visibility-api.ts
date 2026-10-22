import { readApiErrorMessage, unwrapBffPayload } from '@soulsync/shared-types';
import type {
  BiodataAccessRequestDto,
  BiodataAccessRequestListDto,
  BiodataVisibilityPatchDto,
  BiodataVisibilityPolicyDto,
  DecideBiodataAccessRequestDto,
} from '@soulsync/shared-types/biodata-visibility';

async function visibilityFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

  return unwrapBffPayload<T>(raw);
}

function normalizeAccessRequestList(
  list: BiodataAccessRequestListDto,
): BiodataAccessRequestListDto {
  return {
    pending: Array.isArray(list.pending) ? list.pending : [],
    history: Array.isArray(list.history) ? list.history : [],
  };
}

function visibilityBase(managedOwnerUserId?: string | null): string {
  if (managedOwnerUserId) {
    return `/api/biodata/managed/${encodeURIComponent(managedOwnerUserId)}/visibility`;
  }
  return '/api/biodata/visibility';
}

export async function fetchBiodataVisibilityPolicy(
  managedOwnerUserId?: string | null,
): Promise<BiodataVisibilityPolicyDto> {
  return visibilityFetch<BiodataVisibilityPolicyDto>(visibilityBase(managedOwnerUserId));
}

export async function patchBiodataVisibilityPolicy(
  body: BiodataVisibilityPatchDto,
  managedOwnerUserId?: string | null,
): Promise<BiodataVisibilityPolicyDto> {
  return visibilityFetch<BiodataVisibilityPolicyDto>(visibilityBase(managedOwnerUserId), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

function accessRequestsBase(managedOwnerUserId?: string | null): string {
  if (managedOwnerUserId) {
    return `/api/biodata/managed/${encodeURIComponent(managedOwnerUserId)}/access-requests`;
  }
  return '/api/biodata/access-requests';
}

export async function fetchBiodataAccessRequests(
  managedOwnerUserId?: string | null,
): Promise<BiodataAccessRequestListDto> {
  const list = await visibilityFetch<BiodataAccessRequestListDto>(
    accessRequestsBase(managedOwnerUserId),
  );
  return normalizeAccessRequestList(list);
}

export async function decideBiodataAccessRequest(
  requestId: string,
  body: DecideBiodataAccessRequestDto,
  managedOwnerUserId?: string | null,
): Promise<BiodataAccessRequestDto> {
  const base = accessRequestsBase(managedOwnerUserId);
  return visibilityFetch<BiodataAccessRequestDto>(`${base}/${requestId}/decide`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
