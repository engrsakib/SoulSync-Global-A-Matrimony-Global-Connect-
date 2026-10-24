import {
  buildMotherSpouseShortNameBySlot,
  childrenForSpouseRegistryEntry,
  groupChildrenByMotherSlot,
  resolveMotherSpouseDisplayNameForChild,
  validateMarriageRecordForConfirm,
  type MarriageRecordArchiveDto,
  type MarriageRecordChildDto,
  type MarriageRecordDto,
} from '@soulsync/shared-types/marriage-record';

function baseRecord(
  overrides: Partial<MarriageRecordDto> & Pick<MarriageRecordDto, 'slotIndex' | 'status'>,
): MarriageRecordDto {
  return {
    id: `rec-${overrides.slotIndex}`,
    spouseRole: 'WIFE',
    marriageDate: '2015-06-01',
    statusEndedDate: null,
    spouseName: 'Spouse',
    spousePhone: null,
    spouseTelegram: null,
    spouseWhatsApp: null,
    partnerUsername: null,
    linkedPartnerUserId: null,
    marriageConfirmationId: null,
    children: [],
    lockedAt: null,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function baseArchive(
  overrides: Partial<MarriageRecordArchiveDto> &
    Pick<MarriageRecordArchiveDto, 'originalSlotIndex' | 'endedStatus'>,
): MarriageRecordArchiveDto {
  return {
    id: `arc-${overrides.originalSlotIndex}`,
    spouseRole: 'HUSBAND',
    marriageDate: '2010-01-01',
    statusEndedDate: '2018-06-01',
    spouseName: 'Former Husband',
    spousePhone: null,
    spouseTelegram: null,
    spouseWhatsApp: null,
    partnerUsername: null,
    linkedPartnerUserId: null,
    marriageConfirmationId: null,
    children: [],
    lockedAt: null,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    archivedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('resolveMotherSpouseDisplayNameForChild', () => {
  const child: MarriageRecordChildDto = {
    name: 'Amina',
    gender: 'FEMALE',
    dateOfBirth: '2016-01-15',
    motherSlotIndex: 1,
  };

  it('uses archived spouse when child is stored on archive and slot has new draft', () => {
    const archives = [
      baseArchive({
        originalSlotIndex: 1,
        spouseName: 'Farema Busra',
        endedStatus: 'DIVORCED',
        marriageDate: '2012-03-01',
        statusEndedDate: '2019-12-01',
        children: [child],
      }),
    ];
    const records = [
      baseRecord({
        slotIndex: 1,
        status: 'DRAFT',
        spouseName: 'New Wife',
        marriageDate: null,
        children: [],
      }),
    ];

    expect(
      resolveMotherSpouseDisplayNameForChild(child, {
        profileGender: 'MALE',
        records,
        archivedRecords: archives,
        sourceSlotIndex: 1,
        sourceKind: 'archive',
      }),
    ).toBe('Farema Busra');
  });

  it('resolves second wife slot by motherSlotIndex', () => {
    const records = [
      baseRecord({ slotIndex: 1, status: 'CONFIRMED', spouseName: 'First' }),
      baseRecord({ slotIndex: 2, status: 'CONFIRMED', spouseName: 'Second Wife' }),
    ];
    const secondChild: MarriageRecordChildDto = {
      name: 'Yusuf',
      gender: 'MALE',
      dateOfBirth: '2018-02-01',
      motherSlotIndex: 2,
    };

    expect(
      resolveMotherSpouseDisplayNameForChild(secondChild, {
        profileGender: 'MALE',
        records,
        archivedRecords: [],
      }),
    ).toBe('Second Wife');
  });
});

describe('buildMotherSpouseShortNameBySlot', () => {
  it('does not let empty draft overwrite archived spouse on same slot', () => {
    const archives = [
      baseArchive({
        originalSlotIndex: 1,
        spouseName: 'Archived Husband',
        endedStatus: 'DECEASED',
      }),
    ];
    const records = [
      baseRecord({
        slotIndex: 1,
        status: 'DRAFT',
        spouseName: null,
        spouseRole: 'HUSBAND',
      }),
    ];
    const map = buildMotherSpouseShortNameBySlot(records, archives, 'FEMALE');
    expect(map.get(1)).toBe('Archived Husband');
  });
});

describe('childrenForSpouseRegistryEntry', () => {
  it('includes children stored on another slot when motherSlotIndex matches', () => {
    const child: MarriageRecordChildDto = {
      name: 'Yusuf',
      gender: 'MALE',
      dateOfBirth: '2018-02-01',
      motherSlotIndex: 2,
    };
    const records = [
      baseRecord({ slotIndex: 1, status: 'CONFIRMED', spouseName: 'First' }),
      baseRecord({
        slotIndex: 2,
        status: 'DECEASED',
        spouseName: 'Second Wife',
        children: [child],
      }),
    ];
    const forWife2 = childrenForSpouseRegistryEntry(2, [], records, []);
    expect(forWife2).toHaveLength(1);
    expect(forWife2[0]?.name).toBe('Yusuf');
  });
});

describe('groupChildrenByMotherSlot', () => {
  it('preserves motherSlotIndex when stored on a different slot blob', () => {
    const child: MarriageRecordChildDto = {
      name: 'Child',
      gender: 'MALE',
      dateOfBirth: '2019-05-05',
      motherSlotIndex: 2,
    };
    const grouped = groupChildrenByMotherSlot([child], 1);
    expect(grouped.get(2)?.[0]?.motherSlotIndex).toBe(2);
  });
});

describe('validateMarriageRecordForConfirm', () => {
  it('keeps motherSlotIndex in normalized children for multi-wife confirm', () => {
    const records = [
      baseRecord({ slotIndex: 1, status: 'CONFIRMED', spouseName: 'Wife One' }),
      baseRecord({ slotIndex: 2, status: 'DRAFT', spouseName: 'Wife Two' }),
    ];
    const result = validateMarriageRecordForConfirm(
      {
        spouseName: 'Wife Two',
        marriageDate: '2020-01-01',
        spousePhone: '+8801712345678',
        children: [
          {
            name: 'Child',
            gender: 'MALE',
            dateOfBirth: '2021-08-01',
            motherSlotIndex: 1,
          },
        ],
      },
      'BD',
      {
        profileGender: 'MALE',
        namedMotherSlots: [1, 2],
        confirmSlotIndex: 2,
        records,
      },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalized.children[0]?.motherSlotIndex).toBe(1);
    }
  });
});
