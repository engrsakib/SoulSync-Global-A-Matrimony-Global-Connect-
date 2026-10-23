import { resolveNextEditableMarriageSlot } from '@soulsync/shared-types/marriage-record';

describe('resolveNextEditableMarriageSlot', () => {
  it('returns lowest ended slot for male when under confirmed cap', () => {
    const records = [
      { slotIndex: 1, status: 'DIVORCED' as const },
      { slotIndex: 2, status: 'DIVORCED' as const },
      { slotIndex: 3, status: 'CONFIRMED' as const },
      { slotIndex: 4, status: 'CONFIRMED' as const },
    ];
    expect(resolveNextEditableMarriageSlot('MALE', records, 4)).toBe(1);
  });

  it('returns draft slot first', () => {
    const records = [
      { slotIndex: 1, status: 'CONFIRMED' as const },
      { slotIndex: 2, status: 'DRAFT' as const },
    ];
    expect(resolveNextEditableMarriageSlot('MALE', records, 4)).toBe(2);
  });

  it('returns null for male when four confirmed', () => {
    const records = [
      { slotIndex: 1, status: 'CONFIRMED' as const },
      { slotIndex: 2, status: 'CONFIRMED' as const },
      { slotIndex: 3, status: 'CONFIRMED' as const },
      { slotIndex: 4, status: 'CONFIRMED' as const },
    ];
    expect(resolveNextEditableMarriageSlot('MALE', records, 4)).toBeNull();
  });
});
