export const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrength = 'weak' | 'fair' | 'strong';

export type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
  strength: PasswordStrength;
  checks: {
    minLength: boolean;
    uppercase: boolean;
    lowercase: boolean;
    digit: boolean;
    special: boolean;
  };
};

const UPPER = /[A-Z]/;
const LOWER = /[a-z]/;
const DIGIT = /[0-9]/;
const SPECIAL = /[^A-Za-z0-9]/;

export function validatePassword(plain: string): PasswordValidationResult {
  const checks = {
    minLength: plain.length >= PASSWORD_MIN_LENGTH,
    uppercase: UPPER.test(plain),
    lowercase: LOWER.test(plain),
    digit: DIGIT.test(plain),
    special: SPECIAL.test(plain),
  };

  const errors: string[] = [];
  if (!checks.minLength) {
    errors.push(`At least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (!checks.uppercase) {
    errors.push('One uppercase letter');
  }
  if (!checks.lowercase) {
    errors.push('One lowercase letter');
  }
  if (!checks.digit) {
    errors.push('One number');
  }
  if (!checks.special) {
    errors.push('One special character');
  }

  const passed = Object.values(checks).filter(Boolean).length;
  let strength: PasswordStrength = 'weak';
  if (passed >= 5) {
    strength = plain.length >= 12 ? 'strong' : 'fair';
  } else if (passed >= 3) {
    strength = 'fair';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
    checks,
  };
}

export const USERNAME_MIN_LENGTH = 4;
export const USERNAME_MAX_LENGTH = 16;

/** Lowercase letter first; then letters, digits, underscores (4–16 chars total). */
export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{3,15}$/;

export type UsernameValidationResult = {
  valid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;
    startsWithLetter: boolean;
    allowedChars: boolean;
  };
};

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function validateUsername(value: string): UsernameValidationResult {
  const username = normalizeUsername(value);
  const startsWithLetter = /^[a-z]/.test(username);
  const minLength =
    username.length >= USERNAME_MIN_LENGTH && username.length <= USERNAME_MAX_LENGTH;
  const allowedChars = username.length === 0 || USERNAME_PATTERN.test(username);

  const checks = {
    minLength,
    startsWithLetter: username.length === 0 || startsWithLetter,
    allowedChars: username.length === 0 || allowedChars,
  };

  const errors: string[] = [];
  if (username.length > 0 && !startsWithLetter) {
    errors.push('Must start with a letter (a–z)');
  }
  if (username.length > 0 && !minLength) {
    if (username.length < USERNAME_MIN_LENGTH) {
      errors.push(`At least ${USERNAME_MIN_LENGTH} characters`);
    } else {
      errors.push(`At most ${USERNAME_MAX_LENGTH} characters`);
    }
  }
  if (username.length > 0 && startsWithLetter && minLength && !USERNAME_PATTERN.test(username)) {
    errors.push('Use only lowercase letters, numbers, and underscores');
  }

  return {
    valid:
      username.length >= USERNAME_MIN_LENGTH &&
      username.length <= USERNAME_MAX_LENGTH &&
      USERNAME_PATTERN.test(username),
    errors,
    checks,
  };
}

export function normalizeLoginCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 16);
}

export function formatLoginCode(digits: string): string {
  const normalized = normalizeLoginCode(digits);
  const parts: string[] = [];
  for (let i = 0; i < normalized.length; i += 4) {
    parts.push(normalized.slice(i, i + 4));
  }
  return parts.join(' ');
}

export function isCompleteLoginCode(input: string): boolean {
  return normalizeLoginCode(input).length === 16;
}

/** Cryptographically random 16-digit login code (digits only). */
export function generateLoginCode(): string {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error('Secure random generator is not available');
  }
  const digits: string[] = [];
  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);
  for (const byte of bytes) {
    digits.push(String(byte % 10));
  }
  return digits.join('');
}

export function guestLastNameFromLoginCode(code: string): string {
  const normalized = normalizeLoginCode(code);
  return normalized.slice(-4);
}

export function guestDisplayNameFromLoginCode(code: string): string {
  return `Guest ${guestLastNameFromLoginCode(code)}`;
}
