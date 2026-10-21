import { NextResponse } from 'next/server';
import type { CommunityPostShareDto } from '@soulsync/shared-types/communities';
import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';

export const dynamic = 'force-dynamic';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type Params = { params: Promise<{ shareToken: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { shareToken } = await params;

  try {
    const response = await fetch(
      `${apiBaseUrl}/community-posts/share/${encodeURIComponent(shareToken)}`,
      { cache: 'no-store' },
    );
    const raw: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = readApiErrorMessage(raw, 'Share not found');
      return NextResponse.json({ message }, { status: response.status });
    }
    const data = unwrapApiPayload<CommunityPostShareDto>(raw);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ message: 'Request failed' }, { status: 502 });
  }
}
