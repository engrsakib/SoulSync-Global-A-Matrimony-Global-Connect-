import {
  proxyAuthDelete,
  proxyAuthGetWithToken,
  proxyAuthPatch,
  withMessengerAuth,
} from '../../_proxy';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  return withMessengerAuth((token) =>
    proxyAuthGetWithToken(`/messenger/scheduled/${encodeURIComponent(id)}`, token),
  );
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body: unknown = await request.json().catch(() => ({}));
  return withMessengerAuth((token) =>
    proxyAuthPatch(`/messenger/scheduled/${encodeURIComponent(id)}`, body, token),
  );
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  return withMessengerAuth((token) =>
    proxyAuthDelete(`/messenger/scheduled/${encodeURIComponent(id)}`, token),
  );
}
