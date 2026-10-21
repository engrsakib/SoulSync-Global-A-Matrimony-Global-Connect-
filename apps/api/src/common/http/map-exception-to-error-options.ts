import { HttpException, HttpStatus } from '@nestjs/common';
import {
  normalizeValidationErrors,
  type ApiResponseNaming,
  type ErrorResponseOptions,
} from '@soulsync/shared-types';

export type MappedException = {
  statusCode: number;
  options: ErrorResponseOptions;
};

function messageFromHttpBody(body: unknown, fallback: string): string {
  if (typeof body === 'string') {
    return body;
  }
  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    const message = record.message;
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(message)) {
      return message.map(String).join(', ');
    }
    if (typeof record.error === 'string') {
      return record.error;
    }
  }
  return fallback;
}

function codeFromStatus(status: number): string | null {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    default:
      return status >= 500 ? 'INTERNAL_ERROR' : null;
  }
}

export function mapExceptionToErrorOptions(
  exception: unknown,
  requestId: string,
  naming: ApiResponseNaming = 'snake',
): MappedException {
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const body = exception.getResponse();
    const errors =
      normalizeValidationErrors(body) ??
      (Array.isArray(body) ? normalizeValidationErrors(body) : null);
    const message = messageFromHttpBody(body, exception.message);
    const code =
      typeof body === 'object' &&
      body !== null &&
      typeof (body as { code?: unknown }).code === 'string'
        ? ((body as { code: string }).code ?? codeFromStatus(statusCode))
        : errors
          ? 'VALIDATION_FAILED'
          : codeFromStatus(statusCode);

    return {
      statusCode,
      options: {
        message,
        statusCode,
        code,
        errors,
        requestId,
        naming,
      },
    };
  }

  if (exception instanceof Error) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      options: {
        message: exception.message || 'Internal server error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        requestId,
        naming,
      },
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    options: {
      message: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      requestId,
      naming,
    },
  };
}
