/** Keep in sync with `@/lib/theme/cookies` and middleware. */
export const DEVICE_ID_COOKIE_NAME = 'ss_device_id';
export const THEME_PREF_COOKIE_NAME = 'ss_theme_pref';
export const DEVICE_ID_HEADER_NAME = 'x-ss-device-id';

export const THEME_COOKIE_MAX_AGE_SECONDS = 31_104_000;

export const THEME_REDIS_KEY_PREFIX = 'theme:pref:v1:';

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidDeviceId(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_V4_REGEX.test(value);
}
