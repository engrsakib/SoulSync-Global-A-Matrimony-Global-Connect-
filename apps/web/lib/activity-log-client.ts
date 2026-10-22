import {
  isApiSuccessEnvelope,
  readApiErrorMessage,
  unwrapApiPayload,
} from '@soulsync/shared-types';
import type {
  ActivityLogListQueryDto,
  UserActivityLogListDto,
} from '@soulsync/shared-types/activity-log';

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

export function buildActivityLogSearchParams(
  query: ActivityLogListQueryDto,
  cursor?: string,
): string {
  const params = new URLSearchParams();
  if (cursor) {
    params.set('cursor', cursor);
  }
  if (query.limit) {
    params.set('limit', String(query.limit));
  }
  if (query.q?.trim()) {
    params.set('q', query.q.trim());
  }
  if (query.sort) {
    params.set('sort', query.sort);
  }
  if (query.dateFrom) {
    params.set('dateFrom', query.dateFrom);
  }
  if (query.dateTo) {
    params.set('dateTo', query.dateTo);
  }
  for (const type of query.types ?? []) {
    params.append('types', type);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchActivityLog(
  query: ActivityLogListQueryDto = {},
  cursor?: string,
): Promise<UserActivityLogListDto> {
  const params = buildActivityLogSearchParams(query, cursor);
  const response = await fetch(`/api/activity-log${params}`, { cache: 'no-store' });
  return parseJsonResponse<UserActivityLogListDto>(response, 'Could not load activity log');
}
