import { NextResponse } from 'next/server';
import { proxyAuthPut } from '@/lib/api-auth-proxy';
import type {
  MarriageRecordListDto,
  UpsertMarriageRecordChildrenBatchDto,
} from '@soulsync/shared-types/marriage-record';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as UpsertMarriageRecordChildrenBatchDto;
  try {
    const data = await proxyAuthPut<MarriageRecordListDto>(
      '/marriage-records/me/children-batch',
      body,
      token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
