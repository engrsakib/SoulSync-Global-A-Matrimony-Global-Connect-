import { Gender } from '@soulsync/db';
import {
  getAgeRangeError,
  resolvePreferredGender,
} from '../src/partner-preferences/partner-preference.rules';

describe('partner-preference.rules', () => {
  it('resolves opposite gender', () => {
    expect(resolvePreferredGender(Gender.MALE)).toBe(Gender.FEMALE);
    expect(resolvePreferredGender(Gender.FEMALE)).toBe(Gender.MALE);
  });

  it('validates age bounds', () => {
    expect(getAgeRangeError(21, 30)).toBeNull();
    expect(getAgeRangeError(15, 30)).not.toBeNull();
    expect(getAgeRangeError(21, 61)).not.toBeNull();
    expect(getAgeRangeError(35, 21)).not.toBeNull();
  });
});
