import { BadRequestException } from '@nestjs/common';

export function readStringField(value: unknown, field: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  throw new BadRequestException(`${field} must be a string`);
}

export function readOptionalStringField(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = readStringField(value, 'field').trim();
  return text || null;
}
