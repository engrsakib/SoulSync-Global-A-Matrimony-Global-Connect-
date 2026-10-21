export const REQUEST_ID_HEADER = 'x-request-id';

export const SKIP_RESPONSE_ENVELOPE_KEY = 'skipResponseEnvelope';

/** Routes that must return legacy/raw JSON (Terminus, service root). */
export const DEFAULT_ENVELOPE_EXCLUDED_PATH_PREFIXES = ['/v1/health', '/health'] as const;
