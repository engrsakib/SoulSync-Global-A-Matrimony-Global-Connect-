import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { formatApiError, type ApiResponseNaming } from '@soulsync/shared-types';
import { mapExceptionToErrorOptions } from './map-exception-to-error-options';
import { resolveRequestId } from './resolve-request-id';

export type ApiHttpExceptionFilterOptions = {
  naming?: ApiResponseNaming;
};

@Catch()
export class ApiHttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly options: ApiHttpExceptionFilterOptions = {}) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const naming = this.options.naming ?? 'snake';
    const requestId = resolveRequestId(request);

    const { statusCode, options } = mapExceptionToErrorOptions(exception, requestId, naming);
    response.status(statusCode).json(formatApiError(options));
  }
}
