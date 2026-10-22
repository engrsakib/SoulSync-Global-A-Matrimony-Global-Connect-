import { headers } from 'next/headers';

export type ViewerTraceContext = {
  viewerUserId: string;
  viewerUserIdShort: string;
  maskedIp: string;
  serverTimestampIso: string;
};

function maskIpAddress(raw: string | null): string {
  if (!raw?.trim()) {
    return 'unknown';
  }
  const first = raw.split(',')[0]?.trim() ?? raw.trim();
  if (first.includes('.')) {
    const parts = first.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  if (first.includes(':')) {
    const parts = first.split(':').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts.slice(0, 2).join(':')}:xxxx`;
    }
  }
  return 'xxx.xxx.xxx.xxx';
}

export async function getViewerTraceContext(viewerUserId: string): Promise<ViewerTraceContext> {
  const headerStore = await headers();
  const forwarded = headerStore.get('x-forwarded-for');
  const realIp = headerStore.get('x-real-ip');
  const maskedIp = maskIpAddress(forwarded ?? realIp);

  return {
    viewerUserId,
    viewerUserIdShort: viewerUserId.slice(0, 8),
    maskedIp,
    serverTimestampIso: new Date().toISOString(),
  };
}
