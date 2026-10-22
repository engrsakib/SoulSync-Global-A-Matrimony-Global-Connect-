import { isApiErrorEnvelope, isApiSuccessEnvelope } from './guards';

/**
 * Unwrap Nest success envelope, then Next.js BFF `{ data: T }` when present.
 */
export function unwrapBffPayload<T>(raw: unknown): T {
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
import type { ApiFieldError } from './types';

/**
 * Returns the `data` field when `body` is a success envelope; otherwise returns `body` as-is.
 *
 * @example
 * ```ts
 * const tenants = unwrapApiPayload<Tenant[]>(await response.json());
 * ```
 */
export function unwrapApiPayload<T>(body: unknown): T {
  if (isApiSuccessEnvelope(body)) {
    return body.data as T;
  }
  return body as T;
}

/**
 * Reads a human-readable error message from a Nest error envelope or legacy `{ message }` body.
 */
export function readApiErrorMessage(body: unknown, fallback = 'Request failed'): string {
  if (isApiErrorEnvelope(body)) {
    return body.message;
  }
  if (typeof body === 'object' && body !== null) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }
  }
  return fallback;
}

/**
 * Field errors from an error envelope, when present.
 */
export function readApiFieldErrors(body: unknown): ApiFieldError[] | null {
  if (isApiErrorEnvelope(body)) {
    return body.errors;
  }
  return null;
}
