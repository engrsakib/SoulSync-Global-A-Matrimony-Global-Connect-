import type { BiodataProfileDto } from './biodata';
import type { Religion } from './partner-preference';
import {
  formatPhoneForDisplay,
  isValidMobileNumber as isValidPhoneE164,
  parseStoredPhone,
  phonesAreSame,
  type CountryCode,
} from './phone';

export { isValidMobileNumber } from './phone';

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

const MESSAGING_USERNAME_RE = /^[a-zA-Z0-9_]{5,32}$/u;

export function normalizeMessagingUsername(value: string): string {
  return value.trim().replace(/^@/u, '');
}

export function isValidMessagingUsername(
  value: string,
  defaultCountry: CountryCode = 'BD',
): boolean {
  const normalized = normalizeMessagingUsername(value);
  if (!normalized) {
    return true;
  }
  if (MESSAGING_USERNAME_RE.test(normalized)) {
    return true;
  }
  return Boolean(
    parseStoredPhone(value, defaultCountry) || parseStoredPhone(normalized, defaultCountry),
  );
}

export type GuardianContactFields = {
  guardianName: string;
  guardianRelationship: string;
  guardianMobile: string;
  candidateMobile: string;
  guardianTelegram?: string;
  guardianWhatsApp?: string;
  candidateTelegram?: string;
  candidateWhatsApp?: string;
};

export type GuardianContactValidationOptions = {
  defaultPhoneCountry?: CountryCode;
};

export function validateGuardianContactSection(
  religion: Religion,
  fields: GuardianContactFields,
  pledges: MarriagePledgeState,
  options: GuardianContactValidationOptions = {},
): string | null {
  const defaultCountry = options.defaultPhoneCountry ?? 'BD';

  if (!fields.guardianName.trim()) {
    return 'Guardian name is required';
  }
  if (!fields.guardianRelationship.trim()) {
    return 'Relationship with guardian is required';
  }
  if (!isValidPhoneE164(fields.guardianMobile)) {
    return 'Enter a valid guardian mobile number for the selected country';
  }
  if (!isValidPhoneE164(fields.candidateMobile)) {
    return 'Enter a valid candidate contact number for the selected country';
  }
  if (phonesAreSame(fields.guardianMobile, fields.candidateMobile, defaultCountry)) {
    return 'Guardian and candidate contact numbers must be different';
  }

  const messagingChecks: { value: string | undefined; label: string }[] = [
    { value: fields.guardianTelegram, label: 'Guardian Telegram username' },
    { value: fields.guardianWhatsApp, label: 'Guardian WhatsApp username' },
    { value: fields.candidateTelegram, label: 'Candidate Telegram username' },
    { value: fields.candidateWhatsApp, label: 'Candidate WhatsApp username' },
  ];
  for (const { value, label } of messagingChecks) {
    if (value?.trim() && !isValidMessagingUsername(value, defaultCountry)) {
      return `${label} must be a username (5–32 letters, numbers, underscore) or a valid phone number`;
    }
  }

  const requiredItems = getMarriagePledgeItemsForReligion(religion);
  for (const item of requiredItems) {
    if (!pledges[item.key]) {
      return 'Please accept all required marriage pledges before saving';
    }
  }
  return null;
}

/** Normalize mobiles to E.164 for persistence after validation passes. */
export function normalizeGuardianContactPhonesForSave(
  fields: Pick<GuardianContactFields, 'guardianMobile' | 'candidateMobile'>,
  defaultCountry: CountryCode = 'BD',
): { guardianMobile: string; candidateMobile: string } {
  const guardian = parseStoredPhone(fields.guardianMobile, defaultCountry);
  const candidate = parseStoredPhone(fields.candidateMobile, defaultCountry);
  return {
    guardianMobile: guardian?.e164 ?? fields.guardianMobile.trim(),
    candidateMobile: candidate?.e164 ?? fields.candidateMobile.trim(),
  };
}

export function normalizeGuardianContactMessagingForSave(
  fields: Pick<
    GuardianContactFields,
    'guardianTelegram' | 'guardianWhatsApp' | 'candidateTelegram' | 'candidateWhatsApp'
  >,
  defaultCountry: CountryCode = 'BD',
): {
  guardianTelegram: string | null;
  guardianWhatsApp: string | null;
  candidateTelegram: string | null;
  candidateWhatsApp: string | null;
} {
  const trimOrNull = (v: string | undefined) => {
    if (!v?.trim()) {
      return null;
    }
    const asPhone =
      parseStoredPhone(v, defaultCountry) ??
      parseStoredPhone(normalizeMessagingUsername(v), defaultCountry);
    if (asPhone) {
      return asPhone.e164;
    }
    const n = normalizeMessagingUsername(v);
    return n || null;
  };
  return {
    guardianTelegram: trimOrNull(fields.guardianTelegram),
    guardianWhatsApp: trimOrNull(fields.guardianWhatsApp),
    candidateTelegram: trimOrNull(fields.candidateTelegram),
    candidateWhatsApp: trimOrNull(fields.candidateWhatsApp),
  };
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
  guardianTelegram: string;
  guardianWhatsApp: string;
  candidateTelegram: string;
  candidateWhatsApp: string;
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
    guardianMobile: formatPhoneForDisplay(profile.guardianMobile),
    candidateMobile: formatPhoneForDisplay(profile.candidateMobile),
    guardianTelegram: profile.guardianTelegram?.trim()
      ? `@${normalizeMessagingUsername(profile.guardianTelegram)}`
      : '—',
    guardianWhatsApp: profile.guardianWhatsApp?.trim()
      ? `@${normalizeMessagingUsername(profile.guardianWhatsApp)}`
      : '—',
    candidateTelegram: profile.candidateTelegram?.trim()
      ? `@${normalizeMessagingUsername(profile.candidateTelegram)}`
      : '—',
    candidateWhatsApp: profile.candidateWhatsApp?.trim()
      ? `@${normalizeMessagingUsername(profile.candidateWhatsApp)}`
      : '—',
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
