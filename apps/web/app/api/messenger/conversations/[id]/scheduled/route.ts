import {
  proxyAuthGetWithToken,
  proxyAuthPostJson,
  withMessengerAuth,
} from '../../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  return withMessengerAuth((token) =>
    proxyAuthGetWithToken(
      `/messenger/conversations/${encodeURIComponent(id)}/scheduled`,
      token,
    ),
  );
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  return withMessengerAuth((token) =>
    proxyAuthPostJson(
      `/messenger/conversations/${encodeURIComponent(id)}/scheduled`,
      body,
      token,
    ),
  );
}
