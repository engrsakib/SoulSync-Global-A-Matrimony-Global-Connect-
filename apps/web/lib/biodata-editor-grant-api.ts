import { readApiErrorMessage } from '@soulsync/shared-types';
import type {
  BiodataEditorGrantDto,
  BiodataEditorGrantEditorListDto,
  BiodataEditorGrantOwnerListDto,
  DecideBiodataEditorGrantDto,
  InviteBiodataEditorDto,
  RequestBiodataEditorAccessDto,
  TenantMemberUsernameSearchDto,
  UpdateBiodataEditorGrantScopeDto,
} from '@soulsync/shared-types/biodata-editor-grant';
import { unwrapBffPayload } from '@/lib/bff-unwrap';
import { bffFetch } from '@/lib/bff-fetch';

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export async function searchTenantMembersByUsername(
  query: string,
): Promise<TenantMemberUsernameSearchDto[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }
  const response = await bffFetch(
    `/api/biodata/editor-grants/member-search?q=${encodeURIComponent(q)}`,
    { cache: 'no-store', credentials: 'include' },
  );
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not search members'));
  }
  return unwrapBffPayload<TenantMemberUsernameSearchDto[]>(raw);
}

export async function fetchEditorGrantsAsOwner(): Promise<BiodataEditorGrantOwnerListDto> {
  const response = await bffFetch('/api/biodata/editor-grants/mine-as-owner', { cache: 'no-store' });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not load editor access'));
  }
  return unwrapBffPayload<BiodataEditorGrantOwnerListDto>(raw);
}

export async function fetchEditorGrantsAsEditor(): Promise<BiodataEditorGrantEditorListDto> {
  const response = await bffFetch('/api/biodata/editor-grants/mine-as-editor', { cache: 'no-store' });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not load managed biodata'));
  }
  return unwrapBffPayload<BiodataEditorGrantEditorListDto>(raw);
}

export async function inviteBiodataEditor(
  body: InviteBiodataEditorDto,
): Promise<BiodataEditorGrantDto> {
  const response = await bffFetch('/api/biodata/editor-grants/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Invite failed'));
  }
  return unwrapBffPayload<BiodataEditorGrantDto>(raw);
}

export async function requestBiodataEditorAccess(
  body: RequestBiodataEditorAccessDto,
): Promise<BiodataEditorGrantDto> {
  const response = await bffFetch('/api/biodata/editor-grants/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Request failed'));
  }
  return unwrapBffPayload<BiodataEditorGrantDto>(raw);
}

export async function decideBiodataEditorGrant(
  grantId: string,
  body: DecideBiodataEditorGrantDto,
): Promise<BiodataEditorGrantDto> {
  const response = await bffFetch(`/api/biodata/editor-grants/${encodeURIComponent(grantId)}/decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Update failed'));
  }
  return unwrapBffPayload<BiodataEditorGrantDto>(raw);
}

export async function updateBiodataEditorGrantScope(
  grantId: string,
  body: UpdateBiodataEditorGrantScopeDto,
): Promise<BiodataEditorGrantDto> {
  const response = await bffFetch(`/api/biodata/editor-grants/${encodeURIComponent(grantId)}/scope`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not update access'));
  }
  return unwrapBffPayload<BiodataEditorGrantDto>(raw);
}
