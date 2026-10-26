import { withMessengerAuth, proxyAuthPut } from '../_proxy';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  const body: unknown = await request.json().catch(() => ({}));
  return withMessengerAuth((token) => proxyAuthPut('/messenger/keys', body, token));
}
