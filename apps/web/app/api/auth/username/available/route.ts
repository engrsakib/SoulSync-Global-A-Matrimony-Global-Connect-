import { NextResponse } from 'next/server';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type UsernameAvailability = {
  username: string;
  available: boolean;
  valid: boolean;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username') ?? '';
  const query = new URLSearchParams({ username });

  try {
    const response = await fetch(
      `${apiBaseUrl}/auth/username/available?${query.toString()}`,
      { cache: 'no-store' },
    );
    const data = (await response.json().catch(() => ({}))) as UsernameAvailability & {
      message?: string | string[];
    };

    if (!response.ok) {
      const message = data.message;
      const text = Array.isArray(message) ? message.join(', ') : message ?? response.statusText;
      throw new Error(text || `Auth request failed (${response.status})`);
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Username check failed';
    return NextResponse.json({ message }, { status: 502 });
  }
}
