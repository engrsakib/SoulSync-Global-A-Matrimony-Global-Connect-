export type AgeParts = {
  years: number;
  months: number;
  days: number;
};

/** Whole years, months, and days from `dateOfBirth` through `asOf` (default today). */
export function getAgePartsFromIsoDate(isoDate: string, asOf: Date = new Date()): AgeParts | null {
  const birth = new Date(isoDate.slice(0, 10));
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  birth.setHours(0, 0, 0, 0);
  const today = new Date(asOf);
  today.setHours(0, 0, 0, 0);
  if (birth > today) {
    return null;
  }

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'}`;
}

export function formatAgeParts(parts: AgeParts): string {
  return `${plural(parts.years, 'year')}, ${plural(parts.months, 'month')}, ${plural(parts.days, 'day')}`;
}

/** Read-only biodata: calendar date plus age since birth. */
export function formatDateOfBirthDisplay(isoDate: string): string {
  const dateLabel = isoDate.slice(0, 10);
  const parts = getAgePartsFromIsoDate(isoDate);
  if (!parts) {
    return dateLabel;
  }
  return `${dateLabel} · ${formatAgeParts(parts)}`;
}
