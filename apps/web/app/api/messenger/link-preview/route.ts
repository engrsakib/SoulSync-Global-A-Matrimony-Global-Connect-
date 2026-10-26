import { withMessengerAuth, proxyAuthGetWithToken } from '../_proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url');
  if (!url) {
    return Response.json({ message: 'Missing url' }, { status: 400 });
  }
  return withMessengerAuth((token) =>
    proxyAuthGetWithToken(
      `/messenger/link-preview?url=${encodeURIComponent(url)}`,
      token,
    ),
  );
}
