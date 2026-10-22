import type { CustomExpectations, PartnerPreferenceDto } from '../partner-preference';
import type { BiodataMyPreferenceDto, BiodataProfileDto } from '../biodata';

export const COMPATIBILITY_WEIGHTS = {
  educationCareer: 25,
  lifestyleValues: 25,
  location: 20,
  interests: 15,
  ageHeight: 15,
} as const;

export type CompatibilityWeights = typeof COMPATIBILITY_WEIGHTS;

export type CompatibilityBreakdownDto = {
  educationCareer: number;
  lifestyleValues: number;
  location: number;
  interests: number;
  ageHeight: number;
};

export const COMPATIBILITY_SCORING_MODES = ['viewer_to_target'] as const;
export type CompatibilityScoringMode = (typeof COMPATIBILITY_SCORING_MODES)[number];

export type ProfileCompatibilityDto = {
  targetUserId: string;
  eligible: boolean;
  ineligibleReason?: string;
  overallPercent: number | null;
  breakdown: CompatibilityBreakdownDto | null;
  weights: CompatibilityWeights;
  scoringMode: CompatibilityScoringMode;
  computedAt: string;
};

export type CompatibilityProfileSlice = Pick<
  BiodataProfileDto,
  | 'gender'
  | 'dateOfBirth'
  | 'heightCm'
  | 'maritalStatus'
  | 'country'
  | 'stateRegion'
  | 'city'
  | 'religion'
  | 'denomination'
  | 'community'
  | 'motherTongue'
  | 'degreeName'
  | 'occupation'
  | 'bio'
  | 'entertainmentHabits'
  | 'favoriteIslamicBooks'
  | 'favoriteScholars'
  | 'completenessScore'
  | 'isDiscoverable'
  | 'discoveryReligionMode'
  | 'discoveryReligionAllowList'
>;

export type CompatibilityParticipantSnapshot = {
  userId: string;
  tenantId: string;
  username: string | null;
  deletedAt: string | null;
  profile: CompatibilityProfileSlice;
  partnerPreference: PartnerPreferenceDto | null;
  myPreference: BiodataMyPreferenceDto | null;
  /** Max updatedAt among profile + preferences (ISO). */
  matchingVersion: string;
};

export type CompatibilityEligibilityResult =
  { eligible: true } | { eligible: false; reason: string };

export type CompatibilityScoreResult = {
  overallPercent: number;
  breakdown: CompatibilityBreakdownDto;
};

/** Interest tokens derived from profile + expectations text. */
export type CompatibilityInterestSource = {
  bio?: string | null;
  entertainmentHabits?: string | null;
  favoriteIslamicBooks?: string | null;
  favoriteScholars?: string | null;
  specialQualities?: string | null;
};

export type { CustomExpectations };
