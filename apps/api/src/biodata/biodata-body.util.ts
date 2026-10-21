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

export function readOptionalBoundedInt(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    throw new BadRequestException(`${field} must be a whole number`);
  }
  if (num < min || num > max) {
    throw new BadRequestException(`${field} must be between ${min} and ${max}`);
  }
  return num;
}
