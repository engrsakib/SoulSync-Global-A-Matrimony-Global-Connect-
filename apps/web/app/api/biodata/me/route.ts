import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const biodata = await proxyAuthGetWithToken<BiodataMeDto>('/biodata/me', token);
    return NextResponse.json(biodata);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const lower = message.toLowerCase();
    const status = lower.includes('unauthorized') ? 401 : lower.includes('not found') ? 404 : 502;
    return NextResponse.json({ message }, { status });
  }
}
