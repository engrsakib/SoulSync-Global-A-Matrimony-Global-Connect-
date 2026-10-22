import { NextResponse } from 'next/server';
import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type { MemberBiodataLinkPreviewDto } from '@soulsync/shared-types/biodata-view';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { username } = await context.params;

  const response = await fetch(
    `${apiBaseUrl}/biodata/members/${encodeURIComponent(username.trim().toLowerCase())}/preview`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    return NextResponse.json(
      { message: readApiErrorMessage(raw, `Request failed (${response.status})`) },
      { status: response.status },
    );
  }

  const preview = unwrapApiPayload<MemberBiodataLinkPreviewDto>(raw);
  return NextResponse.json({ data: preview });
}
