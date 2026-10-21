import {
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  getExampleNumber,
  isValidPhoneNumber,
  Metadata,
  parsePhoneNumberFromString,
} from 'libphonenumber-js';
import examples from 'libphonenumber-js/mobile/examples';

export type { CountryCode };

export function isCountryCode(value: string): value is CountryCode {
  return getCountries().includes(value as CountryCode);
}

const PINNED_COUNTRIES: CountryCode[] = [
  'BD',
  'IN',
  'PK',
  'SA',
  'AE',
  'GB',
  'US',
  'MY',
  'CA',
  'AU',
];

export type PhoneCountryOption = {
  country: CountryCode;
  name: string;
  callingCode: string;
  flag: string;
};

const COUNTRY_DISPLAY_NAMES = new Intl.DisplayNames(['en'], { type: 'region' });

export function alpha2ToFlagEmoji(alpha2: string): string {
  const code = alpha2.toUpperCase();
  if (!/^[A-Z]{2}$/u.test(code)) {
    return '🏳️';
  }
  const offset = 0x1f1e6 - 65;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
}

function countryDisplayName(country: CountryCode): string {
  try {
    return COUNTRY_DISPLAY_NAMES.of(country) ?? country;
  } catch {
    return country;
  }
}

export function buildPhoneCountryOptions(): PhoneCountryOption[] {
  const all = getCountries();
  const pinnedSet = new Set<string>(PINNED_COUNTRIES);
  const pinned: PhoneCountryOption[] = [];
  const rest: PhoneCountryOption[] = [];

  for (const country of all) {
    const option: PhoneCountryOption = {
      country,
      name: countryDisplayName(country),
      callingCode: `+${getCountryCallingCode(country)}`,
      flag: alpha2ToFlagEmoji(country),
    };
    if (pinnedSet.has(country)) {
      pinned.push(option);
    } else {
      rest.push(option);
    }
  }

  pinned.sort((a, b) => PINNED_COUNTRIES.indexOf(a.country) - PINNED_COUNTRIES.indexOf(b.country));
  rest.sort((a, b) => a.name.localeCompare(b.name));
  return [...pinned, ...rest];
}

export type ParsedStoredPhone = {
  country: CountryCode;
  nationalNumber: string;
  e164: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/gu, '');
}

export function parseStoredPhone(
  value: string | null | undefined,
  defaultCountry: CountryCode = 'BD',
): ParsedStoredPhone | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const withPlus = trimmed.startsWith('+') ? trimmed : null;
  if (withPlus) {
    const parsed = parsePhoneNumberFromString(withPlus);
    if (parsed?.isValid()) {
      return {
        country: parsed.country ?? defaultCountry,
        nationalNumber: parsed.nationalNumber,
        e164: parsed.format('E.164'),
      };
    }
  }

  const nationalDigits = digitsOnly(trimmed);
  if (!nationalDigits) {
    return null;
  }

  const parsedNational = parsePhoneNumberFromString(nationalDigits, defaultCountry);
  if (parsedNational?.isValid()) {
    return {
      country: parsedNational.country ?? defaultCountry,
      nationalNumber: parsedNational.nationalNumber,
      e164: parsedNational.format('E.164'),
    };
  }

  return null;
}

export function formatPhoneE164(country: CountryCode, nationalDigits: string): string | null {
  const digits = digitsOnly(nationalDigits);
  if (!digits) {
    return null;
  }
  const parsed = parsePhoneNumberFromString(digits, country);
  if (!parsed?.isValid()) {
    return null;
  }
  return parsed.format('E.164');
}

export function isValidPhoneForCountry(country: CountryCode, nationalDigits: string): boolean {
  const digits = digitsOnly(nationalDigits);
  if (!digits) {
    return false;
  }
  const parsed = parsePhoneNumberFromString(digits, country);
  return parsed?.isValid() ?? false;
}

export function isValidMobileNumber(value: string, defaultCountry: CountryCode = 'BD'): boolean {
  const parsed = parseStoredPhone(value, defaultCountry);
  if (!parsed) {
    return false;
  }
  return isValidPhoneNumber(parsed.e164);
}

export function phonesAreSame(a: string, b: string, defaultCountry: CountryCode = 'BD'): boolean {
  const parsedA = parseStoredPhone(a, defaultCountry);
  const parsedB = parseStoredPhone(b, defaultCountry);
  if (!parsedA || !parsedB) {
    return false;
  }
  return parsedA.e164 === parsedB.e164;
}

export function formatPhoneForDisplay(
  value: string | null | undefined,
  defaultCountry: CountryCode = 'BD',
): string {
  const parsed = parseStoredPhone(value, defaultCountry);
  if (!parsed) {
    return value?.trim() || '—';
  }
  const phone = parsePhoneNumberFromString(parsed.e164);
  return phone?.formatInternational() ?? parsed.e164;
}

function getNationalSignificantMaxLength(country: CountryCode): number {
  const metadata = new Metadata();
  metadata.selectNumberingPlan(country);
  const lengths = metadata.numberingPlan?.possibleLengths() ?? [];
  if (lengths.length > 0) {
    return Math.max(...lengths);
  }
  const example = getExampleNumber(country, examples);
  if (example) {
    return example.nationalNumber.length;
  }
  return 15;
}

/** Extra digits users type for the national trunk prefix (e.g. leading 0 in BD). */
function getNationalTrunkPrefixDigitCount(country: CountryCode): number {
  const example = getExampleNumber(country, examples);
  if (!example) {
    return 0;
  }
  const formattedDigits = digitsOnly(example.formatNational());
  return Math.max(0, formattedDigits.length - example.nationalNumber.length);
}

export function getPhoneNationalMaxLength(country: CountryCode): number {
  return getNationalSignificantMaxLength(country) + getNationalTrunkPrefixDigitCount(country);
}

/** Digits only, never longer than this country's typed national maximum (incl. trunk 0). */
export function clampPhoneNationalDigits(country: CountryCode, raw: string): string {
  return digitsOnly(raw).slice(0, getPhoneNationalMaxLength(country));
}

export function getPhoneHelperText(country: CountryCode): string {
  const example = getExampleNumber(country, examples);
  const name = countryDisplayName(country);
  const max = getPhoneNationalMaxLength(country);
  if (example) {
    return `${name}: up to ${max} digits (e.g. ${example.formatNational()})`;
  }
  return `${name}: enter up to ${max} digits without the country code`;
}
