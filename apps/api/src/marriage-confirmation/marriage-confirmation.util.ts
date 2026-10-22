import type { Gender } from '@soulsync/db';

const ISO_DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isOppositeGenderPair(initiator: Gender, partner: Gender): boolean {
  if (initiator === 'MALE') {
    return partner === 'FEMALE';
  }
  if (initiator === 'FEMALE') {
    return partner === 'MALE';
  }
  return false;
}

/** Parse YYYY-MM-DD to UTC midnight Date for @db.Date storage. */
export function parseMarriageDateInput(raw: string): Date {
  const trimmed = raw.trim();
  if (!ISO_DATE_ONLY_RE.test(trimmed)) {
    throw new Error('INVALID_DATE');
  }
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error('INVALID_DATE');
  }
  const roundTrip = date.toISOString().slice(0, 10);
  if (roundTrip !== trimmed) {
    throw new Error('INVALID_DATE');
  }
  return date;
}

export function formatMarriageDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
