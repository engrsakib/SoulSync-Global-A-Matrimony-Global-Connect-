import { NextResponse } from 'next/server';
import { proxyAuthPostJson } from '@/lib/api-auth-proxy';
import type { SubscriptionCheckoutIntentDto } from '@soulsync/shared-types/subscription-catalog';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const intent = await proxyAuthPostJson<SubscriptionCheckoutIntentDto>(
      '/subscriptions/checkout-intents',
      body,
      token,
    );
    return NextResponse.json(intent);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
