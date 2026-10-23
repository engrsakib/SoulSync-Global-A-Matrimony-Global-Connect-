import { NextResponse } from 'next/server';
import { proxyAuthPut } from '@/lib/api-auth-proxy';
import type {
  MarriageRecordDto,
  MarriageRecordListDto,
} from '@soulsync/shared-types/marriage-record';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';
import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';

export const dynamic = 'force-dynamic';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type RouteContext = { params: Promise<{ slotIndex: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { slotIndex } = await context.params;
  const response = await fetch(
    `${apiBaseUrl}/marriage-records/slots/${encodeURIComponent(slotIndex)}`,
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
  const data = unwrapApiPayload<MarriageRecordListDto>(raw);
  return NextResponse.json({ data });
}

export async function PUT(request: Request, context: RouteContext) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const { slotIndex } = await context.params;
  const body: unknown = await request.json().catch(() => ({}));
  try {
    const data = await proxyAuthPut<MarriageRecordDto>(
      `/marriage-records/slots/${encodeURIComponent(slotIndex)}`,
      body,
      token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
