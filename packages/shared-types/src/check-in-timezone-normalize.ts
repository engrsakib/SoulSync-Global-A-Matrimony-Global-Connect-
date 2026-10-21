import { isValidIanaTimeZone } from './check-in-calendar';

/** Common primary IANA zones when REST Countries only gives `UTC±…` (esp. :30 offsets). */
const PRIMARY_IANA_BY_ALPHA2: Record<string, string> = {
  BD: 'Asia/Dhaka',
  IN: 'Asia/Kolkata',
  PK: 'Asia/Karachi',
  NP: 'Asia/Kathmandu',
  LK: 'Asia/Colombo',
  AF: 'Asia/Kabul',
  MY: 'Asia/Kuala_Lumpur',
  SG: 'Asia/Singapore',
  ID: 'Asia/Jakarta',
  SA: 'Asia/Riyadh',
  AE: 'Asia/Dubai',
  QA: 'Asia/Qatar',
  KW: 'Asia/Kuwait',
  OM: 'Asia/Muscat',
  BH: 'Asia/Bahrain',
  GB: 'Europe/London',
  US: 'America/New_York',
  CA: 'America/Toronto',
  AU: 'Australia/Sydney',
};

/** REST Countries style label, e.g. `UTC+06:00` → `Etc/GMT-6` (whole-hour offsets only). */
function utcOffsetLabelToEtcGmt(label: string): string | null {
  const match = /^UTC([+-])(\d{1,2})(?::(\d{2}))?$/i.exec(label.trim());
  if (!match) {
    return null;
  }
  const minutes = match[3] ? Number.parseInt(match[3], 10) : 0;
  if (minutes !== 0) {
    return null;
  }
  const hourStr = match[2];
  if (!hourStr) {
    return null;
  }
  const hours = Number.parseInt(hourStr, 10);
  if (!Number.isFinite(hours) || hours > 14) {
    return null;
  }
  const etcSign = match[1] === '+' ? '-' : '+';
  const candidate = `Etc/GMT${etcSign}${hours}`;
  return isValidIanaTimeZone(candidate) ? candidate : null;
}

export function primaryIanaTimeZoneForCountry(alpha2: string | null | undefined): string | null {
  const code = alpha2?.trim().toUpperCase();
  if (!code) {
    return null;
  }
  const zone = PRIMARY_IANA_BY_ALPHA2[code];
  return zone && isValidIanaTimeZone(zone) ? zone : null;
}

/**
 * Accept IANA identifiers and REST Countries `UTC±HH:MM` labels; returns a stored IANA zone.
 */
export function normalizeCheckInTimeZone(
  raw: string,
  options?: { countryAlpha2?: string | null },
): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (isValidIanaTimeZone(trimmed)) {
    return trimmed;
  }

  if (/^UTC/i.test(trimmed)) {
    const fromCountry = primaryIanaTimeZoneForCountry(options?.countryAlpha2);
    if (fromCountry) {
      return fromCountry;
    }
    const fromOffset = utcOffsetLabelToEtcGmt(trimmed);
    if (fromOffset) {
      return fromOffset;
    }
  }

  return null;
}

/** Map REST Countries timezone strings to storable IANA zones for pickers. */
export function normalizeCheckInTimeZoneList(
  zones: string[],
  countryAlpha2?: string | null,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const zone of zones) {
    const normalized =
      normalizeCheckInTimeZone(zone, { countryAlpha2 }) ??
      (isValidIanaTimeZone(zone) ? zone.trim() : null);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      out.push(normalized);
    }
  }
  const primary = primaryIanaTimeZoneForCountry(countryAlpha2);
  if (primary && !seen.has(primary)) {
    out.unshift(primary);
  }
  return out;
}
