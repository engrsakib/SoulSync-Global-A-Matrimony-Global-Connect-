const DEFAULT_CHECK_IN_TIME_ZONE = 'UTC';

/** YYYY-MM-DD in the given IANA time zone. */
export function calendarDateKey(date: Date, timeZone: string): string {
  const tz = timeZone.trim() || DEFAULT_CHECK_IN_TIME_ZONE;
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: DEFAULT_CHECK_IN_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }
}

export function effectiveCheckInTimeZone(checkInTimeZone: string | null | undefined): string {
  const trimmed = checkInTimeZone?.trim();
  return trimmed ? trimmed : DEFAULT_CHECK_IN_TIME_ZONE;
}

/** Returns true when `timeZone` is accepted by Intl (IANA identifier). */
export function isValidIanaTimeZone(timeZone: string): boolean {
  const trimmed = timeZone.trim();
  if (!trimmed) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: trimmed });
    return true;
  } catch {
    return false;
  }
}

export function hasCheckedInToday(
  lastCheckInAt: Date | string | null | undefined,
  checkInTimeZone: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lastCheckInAt) {
    return false;
  }
  const last = lastCheckInAt instanceof Date ? lastCheckInAt : new Date(lastCheckInAt);
  if (Number.isNaN(last.getTime())) {
    return false;
  }
  const tz = effectiveCheckInTimeZone(checkInTimeZone);
  return calendarDateKey(last, tz) === calendarDateKey(now, tz);
}
