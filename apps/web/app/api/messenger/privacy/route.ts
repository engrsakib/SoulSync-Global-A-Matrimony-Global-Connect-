import { withMessengerAuth, proxyAuthPostJson } from '../_proxy';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => ({}));
  return withMessengerAuth((token) => proxyAuthPostJson('/messenger/privacy', body, token));
}
