import { State } from 'country-state-city';
import { listStatesWithOverrides } from '@soulsync/shared-types/geo-state-overrides';

function listStatesLikeService(countryAlpha2: string) {
  const code = countryAlpha2.trim().toUpperCase();
  const fromCsc = State.getStatesOfCountry(code).map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
  }));
  return listStatesWithOverrides(code, fromCsc);
}

describe('GeoCscService state lists', () => {
  it('returns at least 64 Bangladesh subdivisions including supplements', () => {
    const states = listStatesLikeService('BD');
    expect(states.length).toBeGreaterThanOrEqual(64);
    expect(states.some((s) => s.name === 'Dhaka District')).toBe(true);
    expect(states.some((s) => s.name === 'Magura District')).toBe(true);
    expect(states.some((s) => s.name === 'Manikganj District')).toBe(true);
    expect(states.some((s) => s.name === 'Narsingdi District')).toBe(true);
  });

  it('returns full Philippines state list without server-side cap', () => {
    const states = listStatesLikeService('PH');
    expect(states.length).toBeGreaterThanOrEqual(97);
  });
});
