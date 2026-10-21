function legacyUuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * Returns a correlation id for API envelopes.
 * Uses an existing value when provided, otherwise `globalThis.crypto.randomUUID` or a UUID v4 fallback.
 */
export function createRequestId(existing?: string): string {
  const trimmed = existing?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return legacyUuidV4();
}
