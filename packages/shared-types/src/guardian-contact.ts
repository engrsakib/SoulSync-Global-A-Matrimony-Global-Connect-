import type { BiodataProfileDto } from './biodata';
import type { Religion } from './partner-preference';

export const GUARDIAN_CONTACT_VIEW_FEE_BDT = 599;

export const GUARDIAN_RELATIONSHIP_VALUES = [
  'FATHER',
  'MOTHER',
  'PATERNAL_UNCLE',
  'MATERNAL_UNCLE',
  'ELDER_BROTHER',
  'ELDER_SISTER',
  'OTHER',
] as const;

export type GuardianRelationship = (typeof GUARDIAN_RELATIONSHIP_VALUES)[number];

export const GUARDIAN_RELATIONSHIP_LABELS: Record<GuardianRelationship, string> = {
  FATHER: 'Father',
  MOTHER: 'Mother',
  PATERNAL_UNCLE: 'Paternal uncle',
  MATERNAL_UNCLE: 'Maternal uncle',
  ELDER_BROTHER: 'Elder brother',
  ELDER_SISTER: 'Elder sister',
  OTHER: 'Other guardian',
};

/** Resolve stored label or legacy enum code to a dropdown value. */
export function resolveGuardianRelationshipValue(
  stored: string | null | undefined,
): GuardianRelationship | '' {
  const trimmed = stored?.trim();
  if (!trimmed) {
    return '';
  }
  const byKey = GUARDIAN_RELATIONSHIP_VALUES.find((v) => v === trimmed);
  if (byKey) {
    return byKey;
  }
  const byLabel = GUARDIAN_RELATIONSHIP_VALUES.find(
    (v) => GUARDIAN_RELATIONSHIP_LABELS[v].toLowerCase() === trimmed.toLowerCase(),
  );
  return byLabel ?? '';
}

export function getGuardianRelationshipLabel(stored: string | null | undefined): string {
  const resolved = resolveGuardianRelationshipValue(stored);
  if (resolved) {
    return GUARDIAN_RELATIONSHIP_LABELS[resolved];
  }
  return stored?.trim() || '—';
}

export type MarriagePledgeKey =
  | 'marriagePledgeInformationTrue'
  | 'marriagePledgeGuardianConsent'
  | 'marriagePledgeFalseInfoAccountability'
  | 'marriagePledgeMarkAfterMarriage';

export type MarriagePledgeState = Record<MarriagePledgeKey, boolean>;

export const MARRIAGE_PLEDGE_KEYS: MarriagePledgeKey[] = [
  'marriagePledgeInformationTrue',
  'marriagePledgeGuardianConsent',
  'marriagePledgeFalseInfoAccountability',
  'marriagePledgeMarkAfterMarriage',
];

export type MarriagePledgeItem = {
  key: MarriagePledgeKey;
  label: string;
};

export const ISLAM_MARRIAGE_PLEDGE_INTRO =
  'Nikah (marriage) is a sacred act of worship. Please read these commitments carefully and confirm each one. Providing false or misleading information undermines trust and may have serious religious and legal consequences.';

export const ISLAM_MARRIAGE_PLEDGE_ITEMS: MarriagePledgeItem[] = [
  {
    key: 'marriagePledgeInformationTrue',
    label:
      'I affirm that all information I have provided in this biodata is true to the best of my knowledge, and I have not knowingly included false or exaggerated details.',
  },
  {
    key: 'marriagePledgeGuardianConsent',
    label:
      'I confirm that my guardian (or responsible family authority) is aware of this biodata publication and that I am not posting it without their knowledge or permission.',
  },
  {
    key: 'marriagePledgeFalseInfoAccountability',
    label:
      'If I provide incorrect or false information, I understand that I may be held accountable under applicable laws and community rules, and that my account may be permanently restricted on this platform.',
  },
  {
    key: 'marriagePledgeMarkAfterMarriage',
    label:
      'I pledge that after my marriage is completed, I will update or close my biodata on this platform on my own responsibility.',
  },
];

export const GENERAL_MARRIAGE_PLEDGE_ITEMS: MarriagePledgeItem[] = [
  {
    key: 'marriagePledgeMarkAfterMarriage',
    label:
      'I pledge that after my marriage is completed, I will update or close my biodata on this platform on my own responsibility.',
  },
];

export function getMarriagePledgeItemsForReligion(religion: Religion): MarriagePledgeItem[] {
  return religion === 'ISLAM' ? ISLAM_MARRIAGE_PLEDGE_ITEMS : GENERAL_MARRIAGE_PLEDGE_ITEMS;
}

export function isGuardianContactSectionStarted(profile: BiodataProfileDto): boolean {
  return Boolean(
    profile.guardianName?.trim() ||
    profile.guardianRelationship?.trim() ||
    profile.guardianMobile?.trim() ||
    profile.candidateMobile?.trim() ||
    profile.marriagePledgeMarkAfterMarriage,
  );
}

function normalizeMobile(value: string): string {
  return value.replace(/[\s-]/gu, '').trim();
}

export function isValidMobileNumber(value: string): boolean {
  const normalized = normalizeMobile(value);
  if (!/^\+?\d+$/u.test(normalized)) {
    return false;
  }
  const digits = normalized.replace(/^\+/u, '');
  return digits.length >= 10 && digits.length <= 15;
}

export type GuardianContactFields = {
  guardianName: string;
  guardianRelationship: string;
  guardianMobile: string;
  candidateMobile: string;
};

export function validateGuardianContactSection(
  religion: Religion,
  fields: GuardianContactFields,
  pledges: MarriagePledgeState,
): string | null {
  if (!fields.guardianName.trim()) {
    return 'Guardian name is required';
  }
  if (!fields.guardianRelationship.trim()) {
    return 'Relationship with guardian is required';
  }
  if (!isValidMobileNumber(fields.guardianMobile)) {
    return 'Enter a valid guardian mobile number (10–15 digits)';
  }
  if (!isValidMobileNumber(fields.candidateMobile)) {
    return 'Enter a valid candidate contact number (10–15 digits)';
  }

  const requiredItems = getMarriagePledgeItemsForReligion(religion);
  for (const item of requiredItems) {
    if (!pledges[item.key]) {
      return 'Please accept all required marriage pledges before saving';
    }
  }
  return null;
}

export function marriagePledgesFromProfile(profile: BiodataProfileDto): MarriagePledgeState {
  return {
    marriagePledgeInformationTrue: profile.marriagePledgeInformationTrue,
    marriagePledgeGuardianConsent: profile.marriagePledgeGuardianConsent,
    marriagePledgeFalseInfoAccountability: profile.marriagePledgeFalseInfoAccountability,
    marriagePledgeMarkAfterMarriage: profile.marriagePledgeMarkAfterMarriage,
  };
}

export function areRequiredMarriagePledgesComplete(
  religion: Religion,
  pledges: MarriagePledgeState,
): boolean {
  return getMarriagePledgeItemsForReligion(religion).every((item) => pledges[item.key]);
}

export function summarizeGuardianContactRead(
  profile: BiodataProfileDto,
  accountEmail: string | null,
): {
  guardianName: string;
  guardianRelationship: string;
  guardianMobile: string;
  candidateMobile: string;
  accountEmail: string;
  pledgesSummary: string;
  pledgesAcceptedAt: string;
} {
  const items = getMarriagePledgeItemsForReligion(profile.religion);
  const pledges = marriagePledgesFromProfile(profile);
  const acceptedCount = items.filter((i) => pledges[i.key]).length;

  return {
    guardianName: profile.guardianName?.trim() || '—',
    guardianRelationship: getGuardianRelationshipLabel(profile.guardianRelationship),
    guardianMobile: profile.guardianMobile?.trim() || '—',
    candidateMobile: profile.candidateMobile?.trim() || '—',
    accountEmail: accountEmail?.trim() || '—',
    pledgesSummary:
      acceptedCount === items.length
        ? `All ${items.length} pledge(s) accepted`
        : `${acceptedCount} of ${items.length} pledge(s) accepted`,
    pledgesAcceptedAt: profile.marriagePledgesAcceptedAt
      ? new Date(profile.marriagePledgesAcceptedAt).toLocaleDateString(undefined, {
          dateStyle: 'medium',
        })
      : '—',
  };
}
