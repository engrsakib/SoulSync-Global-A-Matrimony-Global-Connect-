import { proxyAuthGetWithToken, withMessengerAuth } from '../../_proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return withMessengerAuth((token) =>
    proxyAuthGetWithToken(`/messenger/giphy/search${qs}`, token),
  );
}
