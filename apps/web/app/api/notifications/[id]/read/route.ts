import { NextResponse } from 'next/server';
import { proxyAuthPatch } from '@/lib/api-auth-proxy';
import type { UserNotificationDto } from '@soulsync/shared-types/notifications';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await proxyAuthPatch<UserNotificationDto>(
      `/notifications/${encodeURIComponent(id)}/read`,
      {},
      token,
    );
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
