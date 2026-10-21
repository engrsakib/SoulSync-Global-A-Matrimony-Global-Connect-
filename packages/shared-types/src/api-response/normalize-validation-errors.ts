import type { ApiFieldError } from './types';

type ClassValidatorError = {
  property?: string;
  constraints?: Record<string, string>;
  children?: ClassValidatorError[];
};

function flattenClassValidatorErrors(
  items: ClassValidatorError[],
  parentPath = '',
): ApiFieldError[] {
  const out: ApiFieldError[] = [];
  for (const item of items) {
    const field = parentPath
      ? `${parentPath}.${item.property ?? 'unknown'}`
      : (item.property ?? 'unknown');
    if (item.constraints) {
      for (const message of Object.values(item.constraints)) {
        out.push({ field, message });
      }
    }
    if (item.children?.length) {
      out.push(...flattenClassValidatorErrors(item.children, field));
    }
  }
  return out;
}

function parseStringMessage(message: string): ApiFieldError {
  const match = /^([a-zA-Z0-9_.[\]]+)\s+(.+)$/.exec(message.trim());
  if (match) {
    return { field: match[1] ?? 'root', message: match[2] ?? message };
  }
  return { field: 'root', message };
}

/**
 * Normalizes Nest `ValidationPipe`, class-validator, and string[] exception bodies
 * into a consistent list of field errors.
 */
export function normalizeValidationErrors(input: unknown): ApiFieldError[] | null {
  if (input == null) {
    return null;
  }

  if (Array.isArray(input)) {
    if (input.length === 0) {
      return null;
    }
    if (typeof input[0] === 'string') {
      return input.map((item) => parseStringMessage(String(item)));
    }
    if (typeof input[0] === 'object' && input[0] !== null) {
      return flattenClassValidatorErrors(input as ClassValidatorError[]);
    }
    return null;
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    if (Array.isArray(record.message)) {
      return normalizeValidationErrors(record.message);
    }
    if (typeof record.message === 'string') {
      return [parseStringMessage(record.message)];
    }
    if (Array.isArray(record.errors)) {
      return normalizeValidationErrors(record.errors);
    }
  }

  return null;
}
