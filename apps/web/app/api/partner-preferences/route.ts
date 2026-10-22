import { NextResponse } from 'next/server';
import { proxyAuthPostJson } from '@/lib/api-auth-proxy';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';
import type { PartnerPreferenceDto } from '@soulsync/shared-types/partner-preference';

export async function POST(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const data = await proxyAuthPostJson<PartnerPreferenceDto>(
      '/partner-preferences',
      body,
      token,
    );
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const status = message.toLowerCase().includes('unauthorized') ? 401 : 400;
    return NextResponse.json({ message }, { status });
  }
}
