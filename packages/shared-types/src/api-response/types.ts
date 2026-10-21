/** Wire key convention for REST JSON bodies. */
export type ApiResponseNaming = 'camel' | 'snake';

/** Optional HATEOAS-style links on success and error envelopes. */
export type ApiResponseLinks = {
  self?: string;
  next?: string;
  prev?: string;
  [key: string]: string | undefined;
};

/** One field-level validation error (class-validator / Nest ValidationPipe). */
export type ApiFieldError = {
  field: string;
  message: string;
  code?: string;
};

/** Extension metadata; `requestId` and `timestamp` also appear on the envelope root. */
export type ApiResponseMeta = {
  requestId: string;
  timestamp: string;
  [key: string]: unknown;
};

export type SuccessResponseOptions<T = null> = {
  /** Payload returned to clients inside `data`. Defaults to `null`. */
  data?: T | null;
  /** Human-readable summary. Defaults to `"Success"`. */
  message?: string;
  /** HTTP status mirrored in the body. Defaults to `200`. */
  statusCode?: number;
  /** Optional extra metadata (not merged with request id / timestamp). */
  meta?: Record<string, unknown> | null;
  /** Optional client hint for a follow-up action. */
  nextStep?: string | null;
  links?: ApiResponseLinks | null;
  /** Correlation id; generated when omitted. */
  requestId?: string;
  naming?: ApiResponseNaming;
};

export type ErrorResponseOptions = {
  message?: string;
  statusCode?: number;
  /** Machine-readable error code (e.g. `VALIDATION_FAILED`). */
  code?: string | null;
  errors?: ApiFieldError[] | null;
  meta?: Record<string, unknown> | null;
  nextStep?: string | null;
  links?: ApiResponseLinks | null;
  requestId?: string;
  naming?: ApiResponseNaming;
};

export type ApiSuccessEnvelopeSnake<T> = {
  success: true;
  status_code: number;
  message: string;
  data: T | null;
  meta: Record<string, unknown> | null;
  next_step: string | null;
  links: ApiResponseLinks | null;
  request_id: string;
  timestamp: string;
};

export type ApiSuccessEnvelopeCamel<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T | null;
  meta: Record<string, unknown> | null;
  nextStep: string | null;
  links: ApiResponseLinks | null;
  requestId: string;
  timestamp: string;
};

export type ApiErrorEnvelopeSnake = {
  success: false;
  status_code: number;
  message: string;
  code: string | null;
  errors: ApiFieldError[] | null;
  meta: Record<string, unknown> | null;
  next_step: string | null;
  links: ApiResponseLinks | null;
  request_id: string;
  timestamp: string;
};

export type ApiErrorEnvelopeCamel = {
  success: false;
  statusCode: number;
  message: string;
  code: string | null;
  errors: ApiFieldError[] | null;
  meta: Record<string, unknown> | null;
  nextStep: string | null;
  links: ApiResponseLinks | null;
  requestId: string;
  timestamp: string;
};

export type ApiSuccessEnvelope<T, N extends ApiResponseNaming = 'snake'> = N extends 'snake'
  ? ApiSuccessEnvelopeSnake<T>
  : ApiSuccessEnvelopeCamel<T>;

export type ApiErrorEnvelope<N extends ApiResponseNaming = 'snake'> = N extends 'snake'
  ? ApiErrorEnvelopeSnake
  : ApiErrorEnvelopeCamel;
