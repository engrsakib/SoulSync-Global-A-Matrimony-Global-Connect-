import { NextResponse } from 'next/server';
import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';
import { jsonErrorMessage } from '@/lib/json-error-message';
import {
  isValidateSubscriptionCouponResponseDto,
  type ValidateSubscriptionCouponRequestDto,
} from '@soulsync/shared-types/subscription-catalog';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export async function POST(request: Request) {
  let body: ValidateSubscriptionCouponRequestDto;
  try {
    body = (await request.json()) as ValidateSubscriptionCouponRequestDto;
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const response = await fetch(`${apiBaseUrl}/subscriptions/coupons/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const raw: unknown = await response.json();
    if (!response.ok) {
      const message = readApiErrorMessage(raw, jsonErrorMessage(raw, 'Validation failed'));
      return NextResponse.json({ message }, { status: response.status });
    }
    const payload = unwrapApiPayload<unknown>(raw);
    if (!isValidateSubscriptionCouponResponseDto(payload)) {
      return NextResponse.json({ message: 'Invalid response' }, { status: 502 });
    }
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ message: 'Service unavailable' }, { status: 502 });
  }
}
