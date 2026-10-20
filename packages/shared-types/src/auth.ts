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
