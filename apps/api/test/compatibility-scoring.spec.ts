import {
  assertCompatibilityEligibility,
  buildEligibleCompatibilityDto,
  scoreCompatibility,
  type CompatibilityParticipantSnapshot,
} from '@soulsync/shared-types/compatibility';
import type { PartnerPreferenceDto } from '@soulsync/shared-types/partner-preference';
import type { BiodataMyPreferenceDto, BiodataProfileDto } from '@soulsync/shared-types/biodata';

function basePartnerPref(overrides: Partial<PartnerPreferenceDto> = {}): PartnerPreferenceDto {
  return {
    id: 'pp1',
    profileId: 'p1',
    userId: 'u1',
    tenantId: 't1',
    preferredGender: 'FEMALE',
    minAge: 21,
    maxAge: 35,
    complexions: [],
    minHeightCm: null,
    maxHeightCm: null,
    educationLevels: ['GRADUATION'],
    occupations: ['SOFTWARE_ENGINEER'],
    maritalStatuses: ['NEVER_MARRIED'],
    minMonthlyIncome: null,
    maxMonthlyIncome: null,
    incomeCurrency: 'USD',
    residenceType: null,
    familyStatus: null,
    siblingCountPreference: null,
    siblingPositionPreference: null,
    preferredDistricts: [],
    preferredCountries: ['Bangladesh'],
    preferredReligions: ['ISLAM'],
    preferredDenominations: [],
    preferredCommunities: [],
    preferredMotherTongues: [],
    employmentTypes: [],
    willingToRelocate: false,
    openToAbroad: false,
    requiresVerifiedProfile: false,
    minProfileCompleteness: 0,
    isActive: true,
    customExpectations: {},
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function baseMyPref(overrides: Partial<BiodataMyPreferenceDto> = {}): BiodataMyPreferenceDto {
  return {
    id: 'mp1',
    profileId: 'p1',
    userId: 'u1',
    tenantId: 't1',
    gender: 'FEMALE',
    complexion: null,
    heightCm: 160,
    educationLevel: 'GRADUATION',
    occupation: 'SOFTWARE_ENGINEER',
    maritalStatus: 'NEVER_MARRIED',
    monthlyIncome: null,
    incomeCurrency: 'USD',
    residenceType: null,
    familyStatus: null,
    siblingCount: null,
    siblingPosition: null,
    district: 'Dhaka District',
    country: 'Bangladesh',
    religion: 'ISLAM',
    denomination: null,
    community: null,
    motherTongue: 'Bengali',
    employmentTypes: [],
    willingToRelocate: false,
    openToAbroad: false,
    customExpectations: {},
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function profileSlice(
  overrides: Partial<BiodataProfileDto> = {},
): CompatibilityParticipantSnapshot['profile'] {
  return {
    gender: 'FEMALE',
    dateOfBirth: '1995-06-15',
    heightCm: 160,
    maritalStatus: 'NEVER_MARRIED',
    country: 'Bangladesh',
    stateRegion: 'Dhaka District',
    city: 'Dhaka',
    religion: 'ISLAM',
    denomination: null,
    community: null,
    motherTongue: 'Bengali',
    degreeName: 'BSc',
    occupation: 'Engineer',
    bio: 'Reading quran hiking travel',
    entertainmentHabits: 'Books',
    favoriteIslamicBooks: 'Riyad us Saliheen',
    favoriteScholars: null,
    completenessScore: 80,
    isDiscoverable: true,
    discoveryReligionMode: 'ALL_RELIGIONS',
    discoveryReligionAllowList: [],
    ...overrides,
  };
}

function participant(
  userId: string,
  gender: 'MALE' | 'FEMALE',
  overrides: Partial<CompatibilityParticipantSnapshot> = {},
): CompatibilityParticipantSnapshot {
  const opposite = gender === 'MALE' ? 'FEMALE' : 'MALE';
  return {
    userId,
    tenantId: 't1',
    username: userId,
    deletedAt: null,
    profile: profileSlice({ gender, ...(overrides.profile ?? {}) }),
    partnerPreference: basePartnerPref({
      userId,
      preferredGender: opposite,
      ...(overrides.partnerPreference ?? {}),
    }),
    myPreference: baseMyPref({ userId, gender, ...(overrides.myPreference ?? {}) }),
    matchingVersion: '2020-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('compatibility', () => {
  it('rejects same gender', () => {
    const viewer = participant('v1', 'MALE');
    const target = participant('t1', 'MALE');
    const result = assertCompatibilityEligibility(viewer, target, {
      viewerUserId: 'v1',
      targetUserId: 't1',
    });
    expect(result.eligible).toBe(false);
  });

  it('scores opposite gender pair', () => {
    const viewer = participant('v1', 'MALE');
    const target = participant('t1', 'FEMALE');
    const eligibility = assertCompatibilityEligibility(viewer, target, {
      viewerUserId: 'v1',
      targetUserId: 't1',
    });
    expect(eligibility.eligible).toBe(true);
    const score = scoreCompatibility(viewer, target);
    expect(score.overallPercent).toBeGreaterThan(0);
    expect(score.overallPercent).toBeLessThanOrEqual(100);
    const dto = buildEligibleCompatibilityDto('t1', score);
    expect(dto.eligible).toBe(true);
    expect(dto.overallPercent).toBe(score.overallPercent);
  });
});
