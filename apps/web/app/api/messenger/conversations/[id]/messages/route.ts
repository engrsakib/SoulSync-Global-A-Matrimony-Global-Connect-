import { withMessengerAuth, proxyAuthGetWithToken } from '../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor');
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return withMessengerAuth((token) =>
    proxyAuthGetWithToken(`/messenger/conversations/${encodeURIComponent(id)}/messages${qs}`, token),
  );
}
