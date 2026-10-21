import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { CreditTransactionListDto } from '@soulsync/shared-types/credits';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const limit = searchParams.get('limit');
  const cursor = searchParams.get('cursor');
  const qs = new URLSearchParams();
  if (limit) {
    qs.set('limit', limit);
  }
  if (cursor) {
    qs.set('cursor', cursor);
  }
  const path = qs.toString() ? `/wallet/transactions?${qs}` : '/wallet/transactions';

  try {
    const list = await proxyAuthGetWithToken<CreditTransactionListDto>(path, token);
    return NextResponse.json({ data: list });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
