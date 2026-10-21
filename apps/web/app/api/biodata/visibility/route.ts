import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken, proxyAuthPatch } from '@/lib/api-auth-proxy';
import type { BiodataVisibilityPolicyDto } from '@soulsync/shared-types/biodata-visibility';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const policy = await proxyAuthGetWithToken<BiodataVisibilityPolicyDto>(
      '/biodata/visibility',
      token,
    );
    return NextResponse.json({ data: policy });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => ({}));

  try {
    const policy = await proxyAuthPatch<BiodataVisibilityPolicyDto>(
      '/biodata/visibility',
      body,
      token,
    );
    return NextResponse.json({ data: policy });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ message }, { status: 400 });
  }
}
