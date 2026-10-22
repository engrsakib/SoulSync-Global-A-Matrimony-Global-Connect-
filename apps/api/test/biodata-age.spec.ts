import {
  BIODATA_MAX_AGE,
  BIODATA_MIN_AGE,
  getBiodataDateOfBirthAgeError,
  getBiodataDateOfBirthIsoBounds,
  getWholeYearsFromIsoDate,
} from '@soulsync/shared-types';

describe('biodata-age', () => {
  const asOf = new Date(2026, 5, 15); // 2026-06-15 local

  it('computes whole years on and before birthday', () => {
    expect(getWholeYearsFromIsoDate('2008-06-15', asOf)).toBe(18);
    expect(getWholeYearsFromIsoDate('2008-06-16', asOf)).toBe(17);
    expect(getWholeYearsFromIsoDate('1976-06-15', asOf)).toBe(50);
    expect(getWholeYearsFromIsoDate('1976-06-14', asOf)).toBe(50);
    expect(getWholeYearsFromIsoDate('1976-06-16', asOf)).toBe(49);
  });

  it('returns ISO bounds for min/max age', () => {
    const { minIso, maxIso } = getBiodataDateOfBirthIsoBounds(asOf);
    expect(minIso).toBe('1976-06-15');
    expect(maxIso).toBe('2008-06-15');
    expect(getBiodataDateOfBirthAgeError(minIso, asOf)).toBeNull();
    expect(getBiodataDateOfBirthAgeError(maxIso, asOf)).toBeNull();
    expect(getBiodataDateOfBirthAgeError('2008-06-16', asOf)).not.toBeNull();
    expect(getBiodataDateOfBirthAgeError('1975-06-15', asOf)).not.toBeNull();
  });

  it('uses configured min and max age constants', () => {
    expect(BIODATA_MIN_AGE).toBe(18);
    expect(BIODATA_MAX_AGE).toBe(50);
  });
});
