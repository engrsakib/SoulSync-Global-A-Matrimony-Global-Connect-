import { isIP } from 'net';

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIp(host: string): boolean {
  if (!isIP(host)) {
    return false;
  }
  if (host === '127.0.0.1' || host === '::1') {
    return true;
  }
  if (host.startsWith('10.') || host.startsWith('192.168.') || host.startsWith('169.254.')) {
    return true;
  }
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
    return true;
  }
  if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) {
    return true;
  }
  return false;
}

/** Returns normalized http(s) URL or null when disallowed (SSRF guard). */
export function assertSafeLinkPreviewUrl(raw: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    return null;
  }
  if (isPrivateIp(host)) {
    return null;
  }
  return url;
}
