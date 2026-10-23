import {
  canViewPendingMarriageReview,
  isOppositeGenderPair,
  parseMarriageDateInput,
  formatMarriageDateOnly,
} from '../src/marriage-confirmation/marriage-confirmation.util';
import { countActiveMarriagesForCapacity } from '@soulsync/shared-types/marriage-record';
import { MarriageConfirmationStatus } from '@soulsync/db';

describe('isOppositeGenderPair', () => {
  it('accepts male with female', () => {
    expect(isOppositeGenderPair('MALE', 'FEMALE')).toBe(true);
  });

  it('accepts female with male', () => {
    expect(isOppositeGenderPair('FEMALE', 'MALE')).toBe(true);
  });

  it('rejects same gender', () => {
    expect(isOppositeGenderPair('MALE', 'MALE')).toBe(false);
    expect(isOppositeGenderPair('FEMALE', 'FEMALE')).toBe(false);
  });
});

describe('canViewPendingMarriageReview', () => {
  const row = {
    status: MarriageConfirmationStatus.PENDING,
    initiatorUserId: 'init',
    partnerUserId: 'partner',
  };

  it('allows initiator and partner only while pending', () => {
    expect(canViewPendingMarriageReview(row, 'init')).toBe(true);
    expect(canViewPendingMarriageReview(row, 'partner')).toBe(true);
    expect(canViewPendingMarriageReview(row, 'other')).toBe(false);
  });

  it('denies when not pending', () => {
    expect(
      canViewPendingMarriageReview(
        { ...row, status: MarriageConfirmationStatus.CONFIRMED },
        'init',
      ),
    ).toBe(false);
  });
});

describe('countActiveMarriagesForCapacity', () => {
  it('counts only registry CONFIRMED for males (ignores unlinked SoulSync CONFIRMED)', () => {
    const records = [
      { status: 'CONFIRMED' as const },
      { status: 'CONFIRMED' as const },
      { status: 'DIVORCED' as const },
      { status: 'DIVORCED' as const },
    ];
    const soulSync = [{ id: 'a' }, { id: 'b' }];
    expect(countActiveMarriagesForCapacity('MALE', records, soulSync, new Set())).toBe(2);
  });

  it('includes unlinked SoulSync CONFIRMED for females', () => {
    const records = [{ status: 'CONFIRMED' as const }];
    const soulSync = [{ id: 'linked' }, { id: 'standalone' }];
    expect(countActiveMarriagesForCapacity('FEMALE', records, soulSync, new Set(['linked']))).toBe(
      2,
    );
  });
});

describe('parseMarriageDateInput', () => {
  it('parses valid ISO date-only strings to UTC midnight', () => {
    const date = parseMarriageDateInput('2024-06-15');
    expect(formatMarriageDateOnly(date)).toBe('2024-06-15');
  });

  it('rejects invalid formats', () => {
    expect(() => parseMarriageDateInput('06/15/2024')).toThrow(/INVALID_DATE/);
    expect(() => parseMarriageDateInput('not-a-date')).toThrow(/INVALID_DATE/);
  });
});
