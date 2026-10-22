import {
  isOppositeGenderPair,
  parseMarriageDateInput,
  formatMarriageDateOnly,
} from '../src/marriage-confirmation/marriage-confirmation.util';

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
