function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function jsonErrorMessage(data: unknown, fallback: string): string {
  if (isRecord(data) && typeof data.message === 'string') {
    return data.message;
  }
  return fallback;
}

export function jsonStringField(data: unknown, key: string): string {
  if (isRecord(data) && typeof data[key] === 'string') {
    return data[key];
  }
  return '';
}
