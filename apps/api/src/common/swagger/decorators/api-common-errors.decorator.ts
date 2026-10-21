import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorEnvelopeDto } from '../dto/api-error-envelope.dto';

export function ApiCommonErrors() {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Validation or bad request',
      type: ApiErrorEnvelopeDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Missing or invalid JWT',
      type: ApiErrorEnvelopeDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
      type: ApiErrorEnvelopeDto,
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict (e.g. email or username already in use)',
      type: ApiErrorEnvelopeDto,
    }),
    ApiResponse({
      status: 429,
      description: 'Rate limited',
      type: ApiErrorEnvelopeDto,
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      type: ApiErrorEnvelopeDto,
    }),
  );
}
