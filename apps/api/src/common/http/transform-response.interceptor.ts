import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable, map } from 'rxjs';
import {
  formatApiSuccess,
  isApiSuccessEnvelope,
  type ApiResponseNaming,
} from '@soulsync/shared-types';
import { SKIP_RESPONSE_ENVELOPE_KEY } from './constants';
import { resolveRequestId } from './resolve-request-id';
import { isNonJsonPayload, shouldSkipSuccessEnvelopePath } from './should-skip-envelope';

export type TransformResponseInterceptorOptions = {
  naming?: ApiResponseNaming;
};

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly options: TransformResponseInterceptorOptions = {},
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const skipMetadata = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_ENVELOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipMetadata || shouldSkipSuccessEnvelopePath(request)) {
      return next.handle();
    }

    const naming = this.options.naming ?? 'snake';
    const requestId = resolveRequestId(request);

    return next.handle().pipe(
      map((body: unknown) => {
        if (isApiSuccessEnvelope(body) || isNonJsonPayload(body)) {
          return body;
        }

        const statusCode = response.statusCode;
        if ((body === undefined || body === null) && statusCode === 204) {
          return body;
        }

        return formatApiSuccess({
          data: body ?? null,
          statusCode,
          requestId,
          naming,
        });
      }),
    );
  }
}
