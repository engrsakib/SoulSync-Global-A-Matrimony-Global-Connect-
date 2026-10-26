import { withMessengerAuth, proxyAuthGetWithToken } from '../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { userId } = await params;
  return withMessengerAuth((token) =>
    proxyAuthGetWithToken(`/messenger/keys/${encodeURIComponent(userId)}`, token),
  );
}
