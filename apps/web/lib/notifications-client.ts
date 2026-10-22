import {
  isApiSuccessEnvelope,
  readApiErrorMessage,
  unwrapApiPayload,
} from '@soulsync/shared-types';
import type {
  UserNotificationDto,
  UserNotificationListDto,
} from '@soulsync/shared-types/notifications';

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

export async function fetchNotifications(cursor?: string): Promise<UserNotificationListDto> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const response = await fetch(`/api/notifications${params}`, { cache: 'no-store' });
  return parseJsonResponse<UserNotificationListDto>(response, 'Could not load notifications');
}

export async function markNotificationRead(id: string): Promise<UserNotificationDto> {
  const response = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'PATCH',
  });
  return parseJsonResponse<UserNotificationDto>(response, 'Could not update notification');
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const response = await fetch('/api/notifications/read-all', { method: 'POST' });
  return parseJsonResponse<{ updated: number }>(response, 'Could not mark notifications read');
}
