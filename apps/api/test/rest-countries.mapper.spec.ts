import {
  mapRestCountryDetail,
  mapRestLanguages,
  pickDefaultMotherTongue,
} from '../src/geo/rest-countries.mapper';
import { normalizeCheckInTimeZone } from '@soulsync/shared-types/check-in';

describe('rest-countries.mapper', () => {
  it('normalizes REST UTC offset labels for check-in', () => {
    expect(normalizeCheckInTimeZone('UTC+06:00', { countryAlpha2: 'BD' })).toBe('Asia/Dhaka');
  });

  it('maps languages and default mother tongue', () => {
    const languages = mapRestLanguages([
      { iso639_1: 'bn', name: 'Bengali' },
      { iso639_1: 'en', name: 'English' },
    ]);
    expect(languages).toEqual([
      { code: 'bn', name: 'Bengali' },
      { code: 'en', name: 'English' },
    ]);
    expect(pickDefaultMotherTongue(languages)).toBe('Bengali');
  });

  it('maps country detail with postal fields', () => {
    const detail = mapRestCountryDetail({
      names: { common: 'Canada' },
      codes: { alpha_2: 'CA' },
      languages: [{ name: 'English' }, { name: 'French' }],
      postal_code: { format: 'A#A #A#', regex: '^[A-Za-z]\\d[A-Za-z] ?\\d[A-Za-z]\\d$' },
      timezones: ['UTC-05:00', 'UTC-08:00'],
    });
    expect(detail).toMatchObject({
      name: 'Canada',
      alpha2: 'CA',
      timezones: expect.arrayContaining(['America/Toronto']),
      defaultMotherTongue: 'English',
      postalFormat: 'A#A #A#',
    });
  });
});
