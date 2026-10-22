import { NextResponse } from 'next/server';
import { proxyAuthGetWithToken, proxyAuthPatch } from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';
import type { PartnerPreferenceDto } from '@soulsync/shared-types/partner-preference';

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await proxyAuthGetWithToken<PartnerPreferenceDto>(
      '/partner-preferences/me',
      token,
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function PATCH(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const data = await proxyAuthPatch<PartnerPreferenceDto>(
      '/partner-preferences/me',
      body,
      token,
    );
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}
