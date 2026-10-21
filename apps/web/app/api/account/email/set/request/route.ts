import { proxyEmailRoute } from '../../_proxy';

export async function POST(request: Request) {
  return proxyEmailRoute<{ message: string }>('/auth/me/email/set/request', request);
}
