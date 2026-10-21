import { applyDecorators } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiSuccessEnvelopeDto } from '../dto/api-success-envelope.dto';

function wrappedDataSchema(model: Type, isArray: boolean) {
  return {
    allOf: [
      { $ref: getSchemaPath(ApiSuccessEnvelopeDto) },
      {
        type: 'object',
        required: ['data'],
        properties: {
          data: isArray
            ? { type: 'array', items: { $ref: getSchemaPath(model) } }
            : { $ref: getSchemaPath(model) },
        },
      },
    ],
  };
}

export function ApiWrappedOkResponse(model: Type, description?: string) {
  return applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeDto, model),
    ApiOkResponse({
      description:
        description ??
        'Success response wrapped in the standard API envelope (`success`, `status_code`, `data`, `request_id`, …).',
      schema: wrappedDataSchema(model, false),
    }),
  );
}

export function ApiWrappedCreatedResponse(model: Type, description?: string) {
  return applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeDto, model),
    ApiCreatedResponse({
      description:
        description ??
        'Created response wrapped in the standard API envelope (`success`, `status_code`, `data`, `request_id`, …).',
      schema: wrappedDataSchema(model, false),
    }),
  );
}

export function ApiWrappedOkArrayResponse(model: Type, description?: string) {
  return applyDecorators(
    ApiExtraModels(ApiSuccessEnvelopeDto, model),
    ApiOkResponse({
      description:
        description ??
        'Success response with `data` as an array, wrapped in the standard API envelope.',
      schema: wrappedDataSchema(model, true),
    }),
  );
}
