import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type {
  CreatePartnerPreferenceInput,
  PartnerPreferenceDto,
  UpdatePartnerPreferenceInput,
} from '@soulsync/shared-types/partner-preference';
import { bffFetch } from '@/lib/bff-fetch';

export type {
  CreatePartnerPreferenceInput,
  CustomExpectations,
  PartnerPreferenceDto,
  UpdatePartnerPreferenceInput,
} from '@soulsync/shared-types/partner-preference';

async function partnerPreferenceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await bffFetch(path, init);
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Request failed (${response.status})`));
  }
  return unwrapApiPayload<T>(raw);
}

export function upsertPartnerPreference(
  body: CreatePartnerPreferenceInput,
): Promise<PartnerPreferenceDto> {
  return partnerPreferenceFetch<PartnerPreferenceDto>('/api/partner-preferences', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getMyPartnerPreference(): Promise<PartnerPreferenceDto> {
  return partnerPreferenceFetch<PartnerPreferenceDto>('/api/partner-preferences/me');
}

export function updateMyPartnerPreference(
  body: UpdatePartnerPreferenceInput,
): Promise<PartnerPreferenceDto> {
  return partnerPreferenceFetch<PartnerPreferenceDto>('/api/partner-preferences/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
