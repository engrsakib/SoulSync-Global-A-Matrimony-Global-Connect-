import { getWholeYearsFromIsoDate } from '../biodata-age';
import type { PartnerPreferenceDto } from '../partner-preference';
import type { BiodataMyPreferenceDto } from '../biodata';
import type {
  CompatibilityBreakdownDto,
  CompatibilityParticipantSnapshot,
  CompatibilityProfileSlice,
  CompatibilityScoreResult,
  ProfileCompatibilityDto,
} from './types';
import { COMPATIBILITY_WEIGHTS } from './types';
import {
  averageScores,
  clampScore,
  enumListIncludes,
  jaccardSimilarity,
  normalizeMatchText,
  stringListIncludes,
  tokenizeInterestText,
} from './utils';

function scoreEducationCareer(
  partnerPref: PartnerPreferenceDto,
  targetProfile: CompatibilityProfileSlice,
  targetMy: BiodataMyPreferenceDto,
): number {
  const parts: number[] = [];

  const education = targetMy.educationLevel;
  if (education != null) {
    parts.push(enumListIncludes(partnerPref.educationLevels, education) ? 100 : 0);
  } else {
    parts.push(50);
  }

  const occupation = targetMy.occupation;
  if (occupation != null) {
    parts.push(enumListIncludes(partnerPref.occupations, occupation) ? 100 : 0);
  } else if (targetProfile.occupation?.trim()) {
    parts.push(60);
  } else {
    parts.push(50);
  }

  if (partnerPref.employmentTypes.length > 0 && targetMy.employmentTypes.length > 0) {
    const allowed = new Set(partnerPref.employmentTypes);
    const targetSet = targetMy.employmentTypes.filter((t) => allowed.has(t));
    parts.push(
      clampScore((targetSet.length / Math.max(partnerPref.employmentTypes.length, 1)) * 100),
    );
  }

  const income = targetMy.monthlyIncome;
  if (
    income != null &&
    (partnerPref.minMonthlyIncome != null || partnerPref.maxMonthlyIncome != null)
  ) {
    const min = partnerPref.minMonthlyIncome ?? 0;
    const max = partnerPref.maxMonthlyIncome ?? Number.MAX_SAFE_INTEGER;
    parts.push(income >= min && income <= max ? 100 : 0);
  }

  return clampScore(averageScores(parts));
}

function scoreLifestyleValues(
  partnerPref: PartnerPreferenceDto,
  targetProfile: CompatibilityProfileSlice,
  targetMy: BiodataMyPreferenceDto,
): number {
  const parts: number[] = [];

  if (partnerPref.preferredReligions.length > 0) {
    const religion = targetMy.religion ?? targetProfile.religion;
    parts.push(partnerPref.preferredReligions.includes(religion) ? 100 : 0);
  } else {
    parts.push(100);
  }

  parts.push(
    stringListIncludes(
      partnerPref.preferredDenominations,
      targetMy.denomination ?? targetProfile.denomination,
    )
      ? 100
      : partnerPref.preferredDenominations.length === 0
        ? 100
        : 0,
  );
  parts.push(
    stringListIncludes(
      partnerPref.preferredCommunities,
      targetMy.community ?? targetProfile.community,
    )
      ? 100
      : partnerPref.preferredCommunities.length === 0
        ? 100
        : 0,
  );
  parts.push(
    stringListIncludes(
      partnerPref.preferredMotherTongues,
      targetMy.motherTongue ?? targetProfile.motherTongue,
    )
      ? 100
      : partnerPref.preferredMotherTongues.length === 0
        ? 100
        : 0,
  );

  const marital = targetMy.maritalStatus ?? targetProfile.maritalStatus;
  parts.push(
    partnerPref.maritalStatuses.length === 0 || partnerPref.maritalStatuses.includes(marital)
      ? 100
      : 0,
  );

  if (targetMy.complexion != null && partnerPref.complexions.length > 0) {
    parts.push(enumListIncludes(partnerPref.complexions, targetMy.complexion) ? 100 : 0);
  }

  if (targetMy.familyStatus != null && partnerPref.familyStatus != null) {
    parts.push(
      partnerPref.familyStatus === 'ANY' || partnerPref.familyStatus === targetMy.familyStatus
        ? 100
        : 0,
    );
  }

  return clampScore(averageScores(parts));
}

function scorePreferredLocationRow(
  country: string | null | undefined,
  state: string | null | undefined,
  city: string | null | undefined,
  targetProfile: CompatibilityProfileSlice,
  targetMy: BiodataMyPreferenceDto,
): number {
  let score = 0;
  const tCountry = normalizeMatchText(targetMy.country ?? targetProfile.country);
  const tState = normalizeMatchText(targetMy.district ?? targetProfile.stateRegion);
  const tCity = normalizeMatchText(targetProfile.city);

  if (country && normalizeMatchText(country) === tCountry) {
    score += 40;
  }
  if (state && normalizeMatchText(state) === tState) {
    score += 35;
  }
  if (city && normalizeMatchText(city) === tCity) {
    score += 25;
  }
  return score;
}

function scoreLocation(
  partnerPref: PartnerPreferenceDto,
  targetProfile: CompatibilityProfileSlice,
  targetMy: BiodataMyPreferenceDto,
): number {
  const ce = partnerPref.customExpectations;
  if (ce.locationFlexibility === 'ANY_DISTRICT') {
    return 100;
  }

  const parts: number[] = [];

  const countryOk =
    partnerPref.preferredCountries.length === 0 ||
    stringListIncludes(partnerPref.preferredCountries, targetMy.country ?? targetProfile.country);
  parts.push(countryOk ? 100 : 0);

  const districtCandidates = [
    targetMy.district,
    targetProfile.stateRegion,
    targetProfile.city,
  ].filter(Boolean) as string[];

  let districtScore = 50;
  if (partnerPref.preferredDistricts.length > 0) {
    districtScore = partnerPref.preferredDistricts.some((d) =>
      districtCandidates.some((c) => normalizeMatchText(c) === normalizeMatchText(d)),
    )
      ? 100
      : 0;
  }
  parts.push(districtScore);

  const rows = ce.preferredLocations ?? [];
  if (rows.length > 0) {
    const best = Math.max(
      ...rows.map((row) =>
        scorePreferredLocationRow(row.country, row.stateRegion, row.city, targetProfile, targetMy),
      ),
    );
    parts.push(clampScore(best));
  }

  let base = clampScore(averageScores(parts));
  if (partnerPref.willingToRelocate || targetMy.willingToRelocate || partnerPref.openToAbroad) {
    base = clampScore(base + 10);
  }
  return base;
}

function collectInterestTokens(
  profile: CompatibilityProfileSlice,
  specialQualities?: string | null,
): Set<string> {
  return tokenizeInterestText(
    profile.bio,
    profile.entertainmentHabits,
    profile.favoriteIslamicBooks,
    profile.favoriteScholars,
    specialQualities,
  );
}

function scoreInterests(
  viewer: CompatibilityParticipantSnapshot,
  target: CompatibilityParticipantSnapshot,
): number {
  const viewerTokens = collectInterestTokens(
    viewer.profile,
    viewer.partnerPreference?.customExpectations.specialQualities,
  );
  const targetTokens = collectInterestTokens(
    target.profile,
    target.partnerPreference?.customExpectations.specialQualities,
  );
  return clampScore(jaccardSimilarity(viewerTokens, targetTokens) * 100);
}

function scoreAgeHeight(
  partnerPref: PartnerPreferenceDto,
  targetProfile: CompatibilityProfileSlice,
  targetMy: BiodataMyPreferenceDto,
): number {
  const parts: number[] = [];

  const years = getWholeYearsFromIsoDate(targetProfile.dateOfBirth.slice(0, 10));
  if (years != null) {
    parts.push(years >= partnerPref.minAge && years <= partnerPref.maxAge ? 100 : 0);
  } else {
    parts.push(0);
  }

  const height = targetMy.heightCm ?? targetProfile.heightCm;
  if (height != null && (partnerPref.minHeightCm != null || partnerPref.maxHeightCm != null)) {
    const min = partnerPref.minHeightCm ?? 0;
    const max = partnerPref.maxHeightCm ?? 300;
    parts.push(height >= min && height <= max ? 100 : 0);
  } else if (height == null) {
    parts.push(50);
  } else {
    parts.push(100);
  }

  return clampScore(averageScores(parts));
}

/** Viewer-centric: how well target fits viewer's partner preference. */
export function scoreCompatibility(
  viewer: CompatibilityParticipantSnapshot,
  target: CompatibilityParticipantSnapshot,
): CompatibilityScoreResult {
  const partnerPref = viewer.partnerPreference!;
  const targetMy = target.myPreference!;

  const breakdown: CompatibilityBreakdownDto = {
    educationCareer: scoreEducationCareer(partnerPref, target.profile, targetMy),
    lifestyleValues: scoreLifestyleValues(partnerPref, target.profile, targetMy),
    location: scoreLocation(partnerPref, target.profile, targetMy),
    interests: scoreInterests(viewer, target),
    ageHeight: scoreAgeHeight(partnerPref, target.profile, targetMy),
  };

  const weighted =
    (breakdown.educationCareer * COMPATIBILITY_WEIGHTS.educationCareer +
      breakdown.lifestyleValues * COMPATIBILITY_WEIGHTS.lifestyleValues +
      breakdown.location * COMPATIBILITY_WEIGHTS.location +
      breakdown.interests * COMPATIBILITY_WEIGHTS.interests +
      breakdown.ageHeight * COMPATIBILITY_WEIGHTS.ageHeight) /
    100;

  return {
    overallPercent: clampScore(weighted),
    breakdown,
  };
}

export function buildIneligibleCompatibilityDto(
  targetUserId: string,
  reason: string,
): ProfileCompatibilityDto {
  return {
    targetUserId,
    eligible: false,
    ineligibleReason: reason,
    overallPercent: null,
    breakdown: null,
    weights: COMPATIBILITY_WEIGHTS,
    scoringMode: 'viewer_to_target',
    computedAt: new Date().toISOString(),
  };
}

export function buildEligibleCompatibilityDto(
  targetUserId: string,
  score: CompatibilityScoreResult,
): ProfileCompatibilityDto {
  return {
    targetUserId,
    eligible: true,
    overallPercent: score.overallPercent,
    breakdown: score.breakdown,
    weights: COMPATIBILITY_WEIGHTS,
    scoringMode: 'viewer_to_target',
    computedAt: new Date().toISOString(),
  };
}
