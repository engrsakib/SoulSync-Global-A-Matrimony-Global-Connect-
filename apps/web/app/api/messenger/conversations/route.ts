import { withMessengerAuth, proxyAuthGetWithToken, proxyAuthPostJson } from '../_proxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withMessengerAuth((token) => proxyAuthGetWithToken('/messenger/conversations', token));
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}));
  return withMessengerAuth((token) => proxyAuthPostJson('/messenger/conversations', body, token));
}
