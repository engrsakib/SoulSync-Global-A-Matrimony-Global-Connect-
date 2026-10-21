import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { LOCATION_DETAILS_MIN_WORDS } from '@soulsync/shared-types/biodata';
import {
  areRequiredMarriagePledgesComplete,
  isValidMobileNumber,
  marriagePledgesFromProfile,
} from '@soulsync/shared-types/guardian-contact';
import { countWords } from '@soulsync/shared-types/word-limit';
import {
  isFaithBranchComplete,
  isFaithMadhabComplete,
} from '@soulsync/shared-types/religion-branches';

type Check = { ok: boolean; weight: number };

function checks(values: Check[]): number {
  const total = values.reduce((sum, item) => sum + item.weight, 0);
  if (total === 0) {
    return 0;
  }
  const earned = values.filter((item) => item.ok).reduce((sum, item) => sum + item.weight, 0);
  return Math.min(100, Math.round((earned / total) * 100));
}

export function computeBiodataCompleteness(data: BiodataMeDto): number {
  const p = data.profile;
  const profileScore = checks([
    { ok: Boolean(p.displayName?.trim()), weight: 10 },
    { ok: Boolean(p.gender), weight: 10 },
    { ok: Boolean(p.dateOfBirth), weight: 10 },
    { ok: Boolean(p.country?.trim() && p.country !== 'Unknown'), weight: 8 },
    { ok: Boolean(p.city?.trim() && p.city !== 'Unknown'), weight: 8 },
    {
      ok: countWords(p.locationDetails ?? '') >= LOCATION_DETAILS_MIN_WORDS,
      weight: 6,
    },
    {
      ok: Boolean(p.degreeName?.trim() || p.education?.trim()),
      weight: 8,
    },
    { ok: Boolean(p.religion), weight: 6 },
    { ok: isFaithBranchComplete(p.religion, p.denomination), weight: 4 },
    {
      ok: isFaithMadhabComplete(p.religion, p.denomination, p.religiousPractice),
      weight: 4,
    },
    {
      ok:
        Boolean(p.guardianName?.trim()) &&
        Boolean(p.guardianRelationship?.trim()) &&
        isValidMobileNumber(p.guardianMobile ?? '') &&
        isValidMobileNumber(p.candidateMobile ?? '') &&
        areRequiredMarriagePledgesComplete(p.religion, marriagePledgesFromProfile(p)),
      weight: 6,
    },
  ]);

  const myScore = data.myPreference
    ? checks([{ ok: Boolean(data.myPreference.gender), weight: 10 }])
    : 0;

  const partnerScore = data.partnerPreference
    ? checks([
        { ok: data.partnerPreference.minAge >= 18, weight: 5 },
        { ok: data.partnerPreference.maxAge >= data.partnerPreference.minAge, weight: 5 },
      ])
    : 0;

  const max = 100;
  const raw = profileScore * 0.7 + myScore * 0.15 + partnerScore * 0.15;
  return Math.min(max, Math.round(raw));
}
