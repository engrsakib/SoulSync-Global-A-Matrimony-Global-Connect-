import { applyDecorators } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';

/** Registers a JSON request body schema in OpenAPI (use on every `@Body()` route). */
export function ApiJsonBody(dto: Type) {
  return applyDecorators(
    ApiBody({
      type: dto,
      required: true,
      description: 'Request payload (`application/json`). Required fields must be present.',
    }),
  );
}
