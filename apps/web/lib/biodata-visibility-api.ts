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

export async function fetchBiodataVisibilityPolicy(): Promise<BiodataVisibilityPolicyDto> {
  return visibilityFetch<BiodataVisibilityPolicyDto>('/api/biodata/visibility');
}

export async function patchBiodataVisibilityPolicy(
  body: BiodataVisibilityPatchDto,
): Promise<BiodataVisibilityPolicyDto> {
  return visibilityFetch<BiodataVisibilityPolicyDto>('/api/biodata/visibility', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function fetchBiodataAccessRequests(): Promise<BiodataAccessRequestListDto> {
  const list = await visibilityFetch<BiodataAccessRequestListDto>('/api/biodata/access-requests');
  return normalizeAccessRequestList(list);
}

export async function decideBiodataAccessRequest(
  requestId: string,
  body: DecideBiodataAccessRequestDto,
): Promise<BiodataAccessRequestDto> {
  return visibilityFetch<BiodataAccessRequestDto>(
    `/api/biodata/access-requests/${requestId}/decide`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}
