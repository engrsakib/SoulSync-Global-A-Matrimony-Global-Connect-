import type { Request } from 'express';
import { DEFAULT_ENVELOPE_EXCLUDED_PATH_PREFIXES } from './constants';

/**
 * Health / Terminus success responses stay raw. All other routes (including `GET /`)
 * are wrapped by the success interceptor.
 */
export function shouldSkipSuccessEnvelopePath(request: Request): boolean {
  const raw = request.originalUrl ?? request.url ?? '';
  const path = raw.split('?')[0] ?? raw;
  return DEFAULT_ENVELOPE_EXCLUDED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** @deprecated Use {@link shouldSkipSuccessEnvelopePath} — errors are always enveloped. */
export const shouldSkipEnvelopePath = shouldSkipSuccessEnvelopePath;

export function isNonJsonPayload(value: unknown): boolean {
  if (value == null) {
    return false;
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
    return true;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'pipe' in value &&
    typeof value.pipe === 'function'
  ) {
    return true;
  }
  return false;
}
