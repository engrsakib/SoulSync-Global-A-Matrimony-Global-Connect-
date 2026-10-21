import type { Religion } from './partner-preference';

export type ReligionBranchOption = { value: string; label: string };

export const RELIGION_LABELS: Record<Religion, string> = {
  ISLAM: 'Islam',
  HINDUISM: 'Hinduism',
  CHRISTIANITY: 'Christianity',
  SIKHISM: 'Sikhism',
  BUDDHISM: 'Buddhism',
  JUDAISM: 'Judaism',
  JAINISM: 'Jainism',
  BAHAI: "Bahá'í",
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

export const ISLAM_BRANCH_SUNNI = 'SUNNI';
export const ISLAM_BRANCH_SHIA = 'SHIA';
export const ISLAM_BRANCH_SUFISM = 'SUFISM';

export const ISLAM_MADHAB_CODES = ['HANAFI', 'SHAFII', 'MALIKI', 'HANBALI'] as const;
export type IslamMadhabCode = (typeof ISLAM_MADHAB_CODES)[number];

export const ISLAM_MADHAB_OPTIONS: ReligionBranchOption[] = [
  { value: 'HANAFI', label: 'Hanafi' },
  { value: 'SHAFII', label: "Shafi'i" },
  { value: 'MALIKI', label: 'Maliki' },
  { value: 'HANBALI', label: 'Hanbali' },
];

export const ISLAM_MASLAK_VALUES = [
  'SARSINA',
  'DEOBANDI',
  'BARELVI',
  'TABLIGH',
  'AHLE_HADITH_SALAFI',
  'OTHER',
  'PREFER_NOT_TO_SAY',
] as const;

export type IslamMaslak = (typeof ISLAM_MASLAK_VALUES)[number];

export const ISLAM_MASLAK_LABELS: Record<IslamMaslak, string> = {
  SARSINA: 'Sarsina',
  DEOBANDI: 'Deobandi',
  BARELVI: 'Barelvi',
  TABLIGH: 'Tabligh',
  AHLE_HADITH_SALAFI: 'Ahle Hadith / Salafi',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

export const ISLAM_MASLAK_OPTIONS: ReligionBranchOption[] = ISLAM_MASLAK_VALUES.map((value) => ({
  value,
  label: ISLAM_MASLAK_LABELS[value],
}));

const ISLAM_BRANCHES: ReligionBranchOption[] = [
  { value: ISLAM_BRANCH_SUNNI, label: 'Sunni' },
  { value: ISLAM_BRANCH_SHIA, label: 'Shia' },
  { value: ISLAM_BRANCH_SUFISM, label: 'Sufism (Tasawwuf)' },
];

const CHRISTIANITY_BRANCHES: ReligionBranchOption[] = [
  { value: 'ROMAN_CATHOLIC', label: 'Roman Catholic' },
  { value: 'PROTESTANT', label: 'Protestant' },
  { value: 'EASTERN_ORTHODOX', label: 'Eastern Orthodox' },
];

const HINDUISM_BRANCHES: ReligionBranchOption[] = [
  { value: 'VAISHNAVISM', label: 'Vaishnavism' },
  { value: 'SHAIVISM', label: 'Shaivism' },
  { value: 'SHAKTISM', label: 'Shaktism' },
  { value: 'SMARTISM', label: 'Smartism' },
];

const BUDDHISM_BRANCHES: ReligionBranchOption[] = [
  { value: 'THERAVADA', label: 'Theravada' },
  { value: 'MAHAYANA', label: 'Mahayana' },
  { value: 'VAJRAYANA', label: 'Vajrayana' },
];

const JAINISM_BRANCHES: ReligionBranchOption[] = [
  { value: 'DIGAMBARA', label: 'Digambara' },
  { value: 'SVETAMBARA', label: 'Svetambara' },
];

const SIKHISM_BRANCHES: ReligionBranchOption[] = [
  { value: 'KHALSA', label: 'Khalsa' },
  { value: 'UDASI', label: 'Udasi' },
  { value: 'NIRMALA', label: 'Nirmala' },
];

export const RELIGION_BRANCH_OPTIONS: Partial<Record<Religion, ReligionBranchOption[]>> = {
  ISLAM: ISLAM_BRANCHES,
  CHRISTIANITY: CHRISTIANITY_BRANCHES,
  HINDUISM: HINDUISM_BRANCHES,
  BUDDHISM: BUDDHISM_BRANCHES,
  JAINISM: JAINISM_BRANCHES,
  SIKHISM: SIKHISM_BRANCHES,
};

export function getReligionBranchOptions(religion: Religion): ReligionBranchOption[] {
  return RELIGION_BRANCH_OPTIONS[religion] ?? [];
}

export function isKnownBranchCode(religion: Religion, code: string | null | undefined): boolean {
  if (!code) {
    return false;
  }
  return getReligionBranchOptions(religion).some((o) => o.value === code);
}

export function getBranchLabel(religion: Religion, code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }
  const option = getReligionBranchOptions(religion).find((o) => o.value === code);
  return option?.label ?? code;
}

export function isIslamMadhabCode(code: string | null | undefined): code is IslamMadhabCode {
  return code != null && (ISLAM_MADHAB_CODES as readonly string[]).includes(code);
}

export function getIslamMaslakLabel(value: IslamMaslak | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return ISLAM_MASLAK_LABELS[value] ?? value;
}

export function getMadhabLabel(code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }
  const option = ISLAM_MADHAB_OPTIONS.find((o) => o.value === code);
  return option?.label ?? code;
}

export function usesIslamMadhabField(
  religion: Religion,
  denomination: string | null | undefined,
): boolean {
  return religion === 'ISLAM' && denomination === ISLAM_BRANCH_SUNNI;
}

/** Returns a user-facing error message, or null when valid. */
export function validateFaithSectionRequired(fields: {
  religion: Religion;
  denomination: string | null;
  religiousPractice: string | null;
}): string | null {
  if (!fields.religion) {
    return 'Faith tradition is required';
  }
  const branchOptions = getReligionBranchOptions(fields.religion);
  if (branchOptions.length > 0 && !fields.denomination?.trim()) {
    return 'Branch / tradition is required';
  }
  if (usesIslamMadhabField(fields.religion, fields.denomination)) {
    const practice = fields.religiousPractice?.trim() ?? '';
    if (!practice) {
      return 'School of jurisprudence (madhab) is required for Sunni Islam';
    }
    if (!isIslamMadhabCode(practice)) {
      return 'Invalid madhab for Sunni Islam';
    }
  }
  return null;
}

export function isFaithBranchComplete(religion: Religion, denomination: string | null): boolean {
  const branchOptions = getReligionBranchOptions(religion);
  if (branchOptions.length === 0) {
    return true;
  }
  return Boolean(denomination?.trim());
}

export function isFaithMadhabComplete(
  religion: Religion,
  denomination: string | null,
  religiousPractice: string | null,
): boolean {
  if (!usesIslamMadhabField(religion, denomination)) {
    return true;
  }
  const practice = religiousPractice?.trim() ?? '';
  return practice.length > 0 && isIslamMadhabCode(practice);
}

export type ReligionPracticeReadProfile = {
  religion: Religion;
  denomination: string | null;
  religiousPractice: string | null;
  islamMaslak: IslamMaslak | null;
  community: string | null;
};

export function formatReligionPracticeRead(profile: ReligionPracticeReadProfile): {
  religion: string;
  branch: string;
  madhabOrPractice: string;
  maslak: string;
  community: string;
} {
  const religion = RELIGION_LABELS[profile.religion] ?? profile.religion;
  const branchLabel = getBranchLabel(profile.religion, profile.denomination);
  const branch = branchLabel ?? profile.denomination?.trim() ?? '—';

  let madhabOrPractice = '—';
  if (usesIslamMadhabField(profile.religion, profile.denomination)) {
    madhabOrPractice =
      getMadhabLabel(profile.religiousPractice) ?? profile.religiousPractice ?? '—';
  } else if (profile.religiousPractice?.trim()) {
    madhabOrPractice = profile.religiousPractice.trim();
  }

  const maslak =
    profile.religion === 'ISLAM' ? (getIslamMaslakLabel(profile.islamMaslak) ?? '—') : '—';

  return {
    religion,
    branch: branch || '—',
    madhabOrPractice,
    maslak,
    community: profile.community?.trim() || '—',
  };
}

/** All valid branch codes for a religion (for API validation). */
export function allowedBranchCodes(religion: Religion): readonly string[] {
  return getReligionBranchOptions(religion).map((o) => o.value);
}
