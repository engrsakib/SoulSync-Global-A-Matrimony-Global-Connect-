/**
 * Server-side fetch to the Nest API. Prefer 127.0.0.1 over localhost (Windows IPv6).
 */
export function resolveSubscriptionApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/v1';

  if (typeof window === 'undefined') {
    return fromEnv.replace('://localhost', '://127.0.0.1');
  }

  return fromEnv;
}
