import { NextResponse } from 'next/server';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';
import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import type { MarriageConfirmationDto } from '@soulsync/shared-types/marriage-confirmation';

export const dynamic = 'force-dynamic';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  const response = await fetch(
    `${apiBaseUrl}/marriage-confirmations/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    return NextResponse.json(
      { message: readApiErrorMessage(raw, 'Request failed') },
      { status: 400 },
    );
  }
  const data = unwrapApiPayload<MarriageConfirmationDto>(raw);
  return NextResponse.json({ data });
}
