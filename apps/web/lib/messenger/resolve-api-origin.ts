/** Socket.io connects to API host without `/v1`. */
export function resolveMessengerApiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
  return base.replace(/\/v1\/?$/, '');
}
