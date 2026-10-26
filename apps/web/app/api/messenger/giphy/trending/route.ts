import { proxyAuthGetWithToken, withMessengerAuth } from '../../_proxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withMessengerAuth((token) =>
    proxyAuthGetWithToken('/messenger/giphy/trending', token),
  );
}
