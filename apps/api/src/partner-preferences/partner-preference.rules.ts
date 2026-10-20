import { Gender, PARTNER_PREFERENCE_MAX_AGE, PARTNER_PREFERENCE_MIN_AGE } from '@soulsync/db';

export function resolvePreferredGender(ownerGender: Gender): Gender {
  if (ownerGender === Gender.MALE) {
    return Gender.FEMALE;
  }
  if (ownerGender === Gender.FEMALE) {
    return Gender.MALE;
  }
  throw new Error(`Unsupported profile gender: ${String(ownerGender)}`);
}

export function getAgeRangeError(minAge: number, maxAge: number): string | null {
  if (minAge < PARTNER_PREFERENCE_MIN_AGE || maxAge > PARTNER_PREFERENCE_MAX_AGE) {
    return `Age must be between ${PARTNER_PREFERENCE_MIN_AGE} and ${PARTNER_PREFERENCE_MAX_AGE}`;
  }
  if (minAge > maxAge) {
    return 'minAge must be less than or equal to maxAge';
  }
  return null;
}

export function getHeightRangeError(
  minHeightCm: number | null | undefined,
  maxHeightCm: number | null | undefined,
): string | null {
  if (minHeightCm != null && maxHeightCm != null && minHeightCm > maxHeightCm) {
    return 'minHeightCm must be less than or equal to maxHeightCm';
  }
  return null;
}

export function getIncomeRangeError(
  minMonthlyIncome: number | null | undefined,
  maxMonthlyIncome: number | null | undefined,
): string | null {
  if (minMonthlyIncome != null && minMonthlyIncome < 0) {
    return 'minMonthlyIncome must be non-negative';
  }
  if (maxMonthlyIncome != null && maxMonthlyIncome < 0) {
    return 'maxMonthlyIncome must be non-negative';
  }
  if (
    minMonthlyIncome != null &&
    maxMonthlyIncome != null &&
    minMonthlyIncome > maxMonthlyIncome
  ) {
    return 'minMonthlyIncome must be less than or equal to maxMonthlyIncome';
  }
  return null;
}

export const CUSTOM_EXPECTATIONS_MAX_BYTES = 16_384;
