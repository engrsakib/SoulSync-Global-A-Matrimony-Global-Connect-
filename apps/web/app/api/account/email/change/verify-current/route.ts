import { proxyEmailRoute } from '../../_proxy';

export async function POST(request: Request) {
  return proxyEmailRoute<{ message: string }>('/auth/me/email/change/verify-current', request);
}
