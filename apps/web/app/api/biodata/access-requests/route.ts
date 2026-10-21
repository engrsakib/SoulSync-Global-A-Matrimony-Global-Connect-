import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken, proxyAuthPostJson } from '@/lib/api-auth-proxy';
import type {
  BiodataAccessRequestDto,
  BiodataAccessRequestListDto,
} from '@soulsync/shared-types/biodata-visibility';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const list = await proxyAuthGetWithToken<BiodataAccessRequestListDto>(
      '/biodata/access-requests',
      token,
    );
    return NextResponse.json({ data: list });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => ({}));

  try {
    const created = await proxyAuthPostJson<BiodataAccessRequestDto>(
      '/biodata/access-requests',
      body,
      token,
    );
    return NextResponse.json({ data: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
