import type { PublicUser } from '@/lib/auth-api';
import { proxyEmailRoute } from '../../_proxy';

export async function POST(request: Request) {
  return proxyEmailRoute<PublicUser>('/auth/me/email/set/confirm', request);
}
