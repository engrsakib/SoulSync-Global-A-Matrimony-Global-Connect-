import { NextResponse } from 'next/server';
import { getServerSessionUser } from '@/lib/auth-server';
import { getViewerTraceContext } from '@/lib/viewer-trace-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getServerSessionUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const trace = await getViewerTraceContext(user.id);
  return NextResponse.json({ data: trace });
}
