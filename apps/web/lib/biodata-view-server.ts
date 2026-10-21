import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type { MemberBiodataViewDto } from '@soulsync/shared-types/biodata-view';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type MemberBiodataViewResult =
  | { ok: true; data: MemberBiodataViewDto }
  | { ok: false; status: number; message: string };

export async function getServerMemberBiodataView(
  username: string,
): Promise<MemberBiodataViewResult> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  const response = await fetch(
    `${apiBaseUrl}/biodata/members/${encodeURIComponent(username.trim().toLowerCase())}/view`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: readApiErrorMessage(raw, `Request failed (${response.status})`),
    };
  }

  return { ok: true, data: unwrapApiPayload<MemberBiodataViewDto>(raw) };
}
