import { filterSearchableSelectOptions } from '@soulsync/shared-types/searchable-select';

describe('searchable-select', () => {
  const hundred = Array.from({ length: 100 }, (_, i) => ({
    value: String(i),
    label: `Option ${i}`,
  }));

  it('returns all options when query is empty', () => {
    expect(filterSearchableSelectOptions(hundred, '')).toHaveLength(100);
  });

  it('returns all matches without an arbitrary cap', () => {
    const matches = filterSearchableSelectOptions(hundred, 'option');
    expect(matches).toHaveLength(100);
  });

  it('filters by substring', () => {
    const matches = filterSearchableSelectOptions(hundred, 'option 9');
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.label.toLowerCase().includes('option 9'))).toBe(true);
  });
});
