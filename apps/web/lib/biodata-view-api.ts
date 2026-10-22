import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type {
  BiodataAccessRequestDto,
  CreateBiodataAccessRequestDto,
} from '@soulsync/shared-types/biodata-visibility';
import type {
  MemberBiodataLinkPreviewDto,
  MemberBiodataViewDto,
} from '@soulsync/shared-types/biodata-view';

async function biodataViewFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

export async function fetchMemberBiodataView(username: string): Promise<MemberBiodataViewDto> {
  return biodataViewFetch<MemberBiodataViewDto>(
    `/api/biodata/members/${encodeURIComponent(username.trim().toLowerCase())}/view`,
  );
}

export async function fetchMemberBiodataLinkPreview(
  username: string,
): Promise<MemberBiodataLinkPreviewDto> {
  return biodataViewFetch<MemberBiodataLinkPreviewDto>(
    `/api/biodata/members/${encodeURIComponent(username.trim().toLowerCase())}/preview`,
  );
}

export async function createBiodataAccessRequest(
  body: CreateBiodataAccessRequestDto,
): Promise<BiodataAccessRequestDto> {
  return biodataViewFetch<BiodataAccessRequestDto>('/api/biodata/access-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
