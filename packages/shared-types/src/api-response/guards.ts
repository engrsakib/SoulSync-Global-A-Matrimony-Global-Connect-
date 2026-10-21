import type {
  ApiErrorEnvelopeCamel,
  ApiErrorEnvelopeSnake,
  ApiSuccessEnvelopeCamel,
  ApiSuccessEnvelopeSnake,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Returns true when `value` looks like an API success envelope (snake or camel).
 */
export function isApiSuccessEnvelope(
  value: unknown,
): value is ApiSuccessEnvelopeSnake<unknown> | ApiSuccessEnvelopeCamel<unknown> {
  if (!isRecord(value) || value.success !== true) {
    return false;
  }
  return 'status_code' in value || 'statusCode' in value;
}

/**
 * Returns true when `value` looks like an API error envelope (snake or camel).
 */
export function isApiErrorEnvelope(
  value: unknown,
): value is ApiErrorEnvelopeSnake | ApiErrorEnvelopeCamel {
  if (!isRecord(value) || value.success !== false) {
    return false;
  }
  return 'status_code' in value || 'statusCode' in value;
}
