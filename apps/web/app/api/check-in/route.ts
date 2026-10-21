import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken, proxyAuthPostJson } from '@/lib/api-auth-proxy';
import type { CheckInResultDto, CheckInStatusDto } from '@soulsync/shared-types/check-in';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const status = await proxyAuthGetWithToken<CheckInStatusDto>('/check-in/status', token);
    return NextResponse.json({ data: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function POST() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await proxyAuthPostJson<CheckInResultDto>('/check-in', {}, token);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Check-in failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
