import type {
  CreatePartnerPreferenceInput,
  PartnerPreferenceDto,
  UpdatePartnerPreferenceInput,
} from '@soulsync/shared-types/partner-preference';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type {
  CreatePartnerPreferenceInput,
  CustomExpectations,
  PartnerPreferenceDto,
  UpdatePartnerPreferenceInput,
} from '@soulsync/shared-types/partner-preference';

function devUserHeaders(userId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId,
  };
}

async function partnerPreferenceFetch<T>(
  path: string,
  userId: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      ...devUserHeaders(userId),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function upsertPartnerPreference(
  userId: string,
  body: CreatePartnerPreferenceInput,
): Promise<PartnerPreferenceDto> {
  return partnerPreferenceFetch<PartnerPreferenceDto>('/partner-preferences', userId, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getMyPartnerPreference(userId: string): Promise<PartnerPreferenceDto> {
  return partnerPreferenceFetch<PartnerPreferenceDto>('/partner-preferences/me', userId);
}

export function updateMyPartnerPreference(
  userId: string,
  body: UpdatePartnerPreferenceInput,
): Promise<PartnerPreferenceDto> {
  return partnerPreferenceFetch<PartnerPreferenceDto>('/partner-preferences/me', userId, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
