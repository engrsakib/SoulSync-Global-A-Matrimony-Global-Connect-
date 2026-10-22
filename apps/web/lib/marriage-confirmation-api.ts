import { readApiErrorMessage } from '@soulsync/shared-types';
import type {
  CreateMarriageConfirmationDto,
  MarriageConfirmationDto,
  MarriageConfirmationListDto,
} from '@soulsync/shared-types/marriage-confirmation';
import type { TenantMemberUsernameSearchDto } from '@soulsync/shared-types/biodata-editor-grant';
import { unwrapBffPayload } from '@/lib/bff-unwrap';
import { bffFetch } from '@/lib/bff-fetch';

async function parseJson(response: Response): Promise<unknown> {
  return response.json().catch(() => ({}));
}

export async function fetchMarriageConfirmations(): Promise<MarriageConfirmationListDto> {
  const response = await bffFetch('/api/marriage-confirmations/me', { cache: 'no-store' });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not load marriage confirmations'));
  }
  return unwrapBffPayload<MarriageConfirmationListDto>(raw);
}

export async function createMarriageConfirmation(
  body: CreateMarriageConfirmationDto,
): Promise<MarriageConfirmationDto> {
  const response = await bffFetch('/api/marriage-confirmations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not send marriage confirmation'));
  }
  return unwrapBffPayload<MarriageConfirmationDto>(raw);
}

export async function acceptMarriageConfirmation(id: string): Promise<MarriageConfirmationDto> {
  const response = await bffFetch(`/api/marriage-confirmations/${encodeURIComponent(id)}/accept`, {
    method: 'POST',
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not accept request'));
  }
  return unwrapBffPayload<MarriageConfirmationDto>(raw);
}

export async function declineMarriageConfirmation(id: string): Promise<MarriageConfirmationDto> {
  const response = await bffFetch(`/api/marriage-confirmations/${encodeURIComponent(id)}/decline`, {
    method: 'POST',
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not decline request'));
  }
  return unwrapBffPayload<MarriageConfirmationDto>(raw);
}

export async function cancelMarriageConfirmation(id: string): Promise<MarriageConfirmationDto> {
  const response = await bffFetch(`/api/marriage-confirmations/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not cancel request'));
  }
  return unwrapBffPayload<MarriageConfirmationDto>(raw);
}

export async function searchMarriagePartnerUsernames(
  query: string,
): Promise<TenantMemberUsernameSearchDto[]> {
  const q = query.trim();
  if (!q) {
    return [];
  }
  const response = await bffFetch(
    `/api/biodata/editor-grants/member-search?q=${encodeURIComponent(q)}&oppositeGenderOnly=true`,
    { cache: 'no-store', credentials: 'include' },
  );
  const raw = await parseJson(response);
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, 'Could not search members'));
  }
  return unwrapBffPayload<TenantMemberUsernameSearchDto[]>(raw);
}
