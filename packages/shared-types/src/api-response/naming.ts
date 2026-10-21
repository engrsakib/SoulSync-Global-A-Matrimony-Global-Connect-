import type {
  ApiErrorEnvelopeCamel,
  ApiErrorEnvelopeSnake,
  ApiFieldError,
  ApiResponseNaming,
  ApiSuccessEnvelopeCamel,
  ApiSuccessEnvelopeSnake,
} from './types';

type CanonicalSuccess<T> = {
  success: true;
  statusCode: number;
  message: string;
  data: T | null;
  meta: Record<string, unknown> | null;
  nextStep: string | null;
  links: Record<string, string | undefined> | null;
  requestId: string;
  timestamp: string;
};

type CanonicalError = {
  success: false;
  statusCode: number;
  message: string;
  code: string | null;
  errors: ApiFieldError[] | null;
  meta: Record<string, unknown> | null;
  nextStep: string | null;
  links: Record<string, string | undefined> | null;
  requestId: string;
  timestamp: string;
};

export function toSuccessWire<T>(
  canonical: CanonicalSuccess<T>,
  naming: ApiResponseNaming,
): ApiSuccessEnvelopeSnake<T> | ApiSuccessEnvelopeCamel<T> {
  if (naming === 'camel') {
    return { ...canonical };
  }
  return {
    success: true,
    status_code: canonical.statusCode,
    message: canonical.message,
    data: canonical.data,
    meta: canonical.meta,
    next_step: canonical.nextStep,
    links: canonical.links,
    request_id: canonical.requestId,
    timestamp: canonical.timestamp,
  };
}

export function toErrorWire(
  canonical: CanonicalError,
  naming: ApiResponseNaming,
): ApiErrorEnvelopeSnake | ApiErrorEnvelopeCamel {
  if (naming === 'camel') {
    return { ...canonical };
  }
  return {
    success: false,
    status_code: canonical.statusCode,
    message: canonical.message,
    code: canonical.code,
    errors: canonical.errors,
    meta: canonical.meta,
    next_step: canonical.nextStep,
    links: canonical.links,
    request_id: canonical.requestId,
    timestamp: canonical.timestamp,
  };
}
