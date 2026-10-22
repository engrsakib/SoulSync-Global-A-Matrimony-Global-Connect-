import {
  isApiSuccessEnvelope,
  readApiErrorMessage,
  unwrapApiPayload,
} from '@soulsync/shared-types';
import type { UserActivityLogListDto } from '@soulsync/shared-types/activity-log';

function unwrapBffBody<T>(raw: unknown): T {
  const payload = unwrapApiPayload<unknown>(raw);
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    !isApiSuccessEnvelope(payload)
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

async function parseJsonResponse<T>(response: Response, fallback: string): Promise<T> {
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, fallback));
  }
  return unwrapBffBody<T>(raw);
}

export async function fetchActivityLog(cursor?: string): Promise<UserActivityLogListDto> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const response = await fetch(`/api/activity-log${params}`, { cache: 'no-store' });
  return parseJsonResponse<UserActivityLogListDto>(response, 'Could not load activity log');
}
