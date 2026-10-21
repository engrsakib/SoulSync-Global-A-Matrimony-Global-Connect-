import { buildLegacyEducationSummary } from '../src/biodata/education-career.util';

describe('buildLegacyEducationSummary', () => {
  it('joins degree, major, and institution', () => {
    expect(
      buildLegacyEducationSummary({
        degreeName: 'BSc',
        degreeMajor: 'Computer Science',
        institution: 'Dhaka University',
      }),
    ).toBe('BSc, in Computer Science, Dhaka University');
  });

  it('returns null when all parts empty', () => {
    expect(buildLegacyEducationSummary({})).toBeNull();
  });
});
