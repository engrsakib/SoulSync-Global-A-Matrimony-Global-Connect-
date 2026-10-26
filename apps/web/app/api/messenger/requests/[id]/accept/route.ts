import { withMessengerAuth, proxyAuthPostJson } from '../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  return withMessengerAuth((token) =>
    proxyAuthPostJson(`/messenger/requests/${encodeURIComponent(id)}/accept`, {}, token),
  );
}
