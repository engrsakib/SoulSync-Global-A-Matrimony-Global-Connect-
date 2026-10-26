import { withMessengerAuth, proxyAuthPostJson } from '../_proxy';

export const dynamic = 'force-dynamic';

export async function POST() {
  return withMessengerAuth((token) => proxyAuthPostJson('/messenger/socket-ticket', {}, token));
}
