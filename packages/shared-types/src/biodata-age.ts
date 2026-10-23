export const BIODATA_MIN_AGE = 18;
export const BIODATA_MAX_AGE = 50;

function startOfLocalDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Subtract whole calendar years from a date (handles Feb 29 → Feb 28). */
export function subtractYears(from: Date, years: number): Date {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() - years);
  return startOfLocalDay(d);
}

/** Whole years between birth (ISO date) and asOf, matching calendar age semantics. */
export function getWholeYearsFromIsoDate(isoDate: string, asOf: Date = new Date()): number | null {
  const birth = startOfLocalDay(new Date(isoDate.slice(0, 10)));
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = startOfLocalDay(asOf);
  if (birth > today) {
    return null;
  }

  let years = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    years -= 1;
  }
  return years;
}

export type AgeYmdParts = {
  years: number;
  months: number;
  days: number;
};

/** Calendar years, months, and days from birth (ISO date) to asOf (local midnight semantics). */
export function getAgeYmdPartsFromIsoDate(
  isoDate: string,
  asOf: Date = new Date(),
): AgeYmdParts | null {
  const birth = startOfLocalDay(new Date(isoDate.slice(0, 10)));
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = startOfLocalDay(asOf);
  if (birth > today) {
    return null;
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function ageUnitLabel(value: number, singular: string): string {
  return value === 1 ? singular : `${singular}s`;
}

/** e.g. "1 year 12 months 30 days" */
export function formatAgeYmdFromIsoDate(isoDate: string, asOf: Date = new Date()): string | null {
  const parts = getAgeYmdPartsFromIsoDate(isoDate, asOf);
  if (!parts) {
    return null;
  }
  const { years, months, days } = parts;
  return `${years} ${ageUnitLabel(years, 'year')} ${months} ${ageUnitLabel(months, 'month')} ${days} ${ageUnitLabel(days, 'day')}`;
}

export type BiodataDateOfBirthIsoBounds = {
  /** Earliest selectable DOB (user at most maxAge). */
  minIso: string;
  /** Latest selectable DOB (user at least minAge). */
  maxIso: string;
};

export function getBiodataDateOfBirthIsoBounds(
  asOf: Date = new Date(),
  minAge: number = BIODATA_MIN_AGE,
  maxAge: number = BIODATA_MAX_AGE,
): BiodataDateOfBirthIsoBounds {
  const today = startOfLocalDay(asOf);
  return {
    minIso: toIsoDate(subtractYears(today, maxAge)),
    maxIso: toIsoDate(subtractYears(today, minAge)),
  };
}

export function getBiodataDateOfBirthAgeError(
  isoDate: string,
  asOf: Date = new Date(),
  minAge: number = BIODATA_MIN_AGE,
  maxAge: number = BIODATA_MAX_AGE,
): string | null {
  const years = getWholeYearsFromIsoDate(isoDate, asOf);
  if (years === null) {
    return 'Invalid date of birth';
  }
  if (years < minAge || years > maxAge) {
    return `Age must be between ${minAge} and ${maxAge}`;
  }
  return null;
}
