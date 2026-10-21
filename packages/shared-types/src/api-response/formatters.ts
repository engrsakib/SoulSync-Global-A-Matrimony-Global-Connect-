import { toErrorWire, toSuccessWire } from './naming';
import { createRequestId } from './request-id';
import type {
  ApiErrorEnvelope,
  ApiResponseNaming,
  ApiSuccessEnvelope,
  ErrorResponseOptions,
  SuccessResponseOptions,
} from './types';

/**
 * Builds a typed success envelope for REST responses.
 *
 * @example
 * ```ts
 * return formatApiSuccess({
 *   data: { id: '1' },
 *   message: 'Profile loaded',
 *   statusCode: 200,
 *   requestId: req.headers['x-request-id'],
 * });
 * ```
 *
 * @example
 * ```ts
 * formatApiSuccess({ data: users, naming: 'camel' });
 * ```
 */
export function formatApiSuccess<T, N extends ApiResponseNaming = 'snake'>(
  options: SuccessResponseOptions<T> = {},
): ApiSuccessEnvelope<T, N> {
  const naming = (options.naming ?? 'snake') as N;
  const requestId = createRequestId(options.requestId);
  const canonical = {
    success: true as const,
    statusCode: options.statusCode ?? 200,
    message: options.message ?? 'Success',
    data: options.data ?? null,
    meta: options.meta ?? null,
    nextStep: options.nextStep ?? null,
    links: options.links ?? null,
    requestId,
    timestamp: new Date().toISOString(),
  };
  return toSuccessWire(canonical, naming) as ApiSuccessEnvelope<T, N>;
}

/**
 * Builds a typed error envelope for REST responses.
 *
 * @example
 * ```ts
 * formatApiError({
 *   message: 'Validation failed',
 *   statusCode: 400,
 *   code: 'VALIDATION_FAILED',
 *   errors: [{ field: 'email', message: 'must be an email' }],
 * });
 * ```
 */
export function formatApiError<N extends ApiResponseNaming = 'snake'>(
  options: ErrorResponseOptions = {},
): ApiErrorEnvelope<N> {
  const naming = (options.naming ?? 'snake') as N;
  const requestId = createRequestId(options.requestId);
  const canonical = {
    success: false as const,
    statusCode: options.statusCode ?? 500,
    message: options.message ?? 'Something went wrong',
    code: options.code ?? null,
    errors: options.errors ?? null,
    meta: options.meta ?? null,
    nextStep: options.nextStep ?? null,
    links: options.links ?? null,
    requestId,
    timestamp: new Date().toISOString(),
  };
  return toErrorWire(canonical, naming) as ApiErrorEnvelope<N>;
}

/** @deprecated Use {@link formatApiSuccess} */
export const success = formatApiSuccess;

/** @deprecated Use {@link formatApiError} */
export const error = formatApiError;
