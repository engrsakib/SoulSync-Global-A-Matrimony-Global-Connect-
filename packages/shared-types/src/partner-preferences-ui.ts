import type { CustomExpectations, PartnerPreferenceDto } from './partner-preference';
import type {
  ComplexionPreference,
  EducationPreference,
  FamilyStatusPreference,
  Gender,
  OccupationPreference,
  Religion,
} from './partner-preference';
import { MARITAL_STATUS_LABELS } from './partner-preference';
import { RELIGION_LABELS } from './religion-branches';
import { countWords } from './word-limit';

export const PARTNER_PREFERENCE_NOTES_MAX_WORDS = 300;

/** Partner preference skin tone (stored as `complexions[]`). */
export const COMPLEXION_PREFERENCE_LABELS: Record<ComplexionPreference, string> = {
  VERY_FAIR: 'Very fair skin',
  FAIR: 'Fair skin',
  WHEATISH: 'Wheatish / medium tan',
  DARK: 'Dark skin',
  ANY: 'Any skin tone',
};

export const PREFERRED_SKIN_TONE_UI_LABEL = 'Preferred skin tone';

export const EDUCATION_PREFERENCE_LABELS: Record<EducationPreference, string> = {
  SECONDARY: 'Secondary',
  HSC: 'HSC / equivalent',
  GRADUATION: "Graduate (Bachelor's)",
  POST_GRADUATION: 'Post-graduate',
  MADRASAH: 'Madrasah / Islamic studies',
  PROFESSIONAL: 'Professional degree',
  ANY: 'Any',
};

export const OCCUPATION_PREFERENCE_LABELS: Record<OccupationPreference, string> = {
  SOFTWARE_ENGINEER: 'Software / IT',
  BUSINESS: 'Business',
  GOVERNMENT_JOB: 'Government job',
  DOCTOR: 'Doctor / medical',
  TEACHER: 'Teacher',
  ENGINEER: 'Engineer',
  ACCOUNTANT: 'Accountant',
  OTHER: 'Other',
  ANY: 'Any',
};

export const FAMILY_STATUS_PREFERENCE_LABELS: Record<FamilyStatusPreference, string> = {
  UPPER_CLASS: 'Upper class / affluent',
  HIGH_MIDDLE_CLASS: 'Respectable upper-middle class',
  MIDDLE_CLASS: 'Middle class',
  ANY: 'Any',
};

export const PARTNER_RELIGIOUSNESS_VALUES = ['HIGH', 'MODERATE', 'FLEXIBLE'] as const;
export type PartnerReligiousnessLevel = (typeof PARTNER_RELIGIOUSNESS_VALUES)[number];

type ReligiousnessLabelTable = Record<PartnerReligiousnessLevel, string>;

const RELIGIOUSNESS_ISLAM_FEMALE_SEEKER: ReligiousnessLabelTable = {
  HIGH: 'High — regular salah; established Sunnah beard essential',
  MODERATE: 'Moderate — generally practicing Islam',
  FLEXIBLE: 'Flexible — open to different levels of Islamic practice',
};

const RELIGIOUSNESS_ISLAM_MALE_SEEKER: ReligiousnessLabelTable = {
  HIGH: 'High — regular salah; modest dress / hijab essential',
  MODERATE: 'Moderate — generally practicing Islam',
  FLEXIBLE: 'Flexible — open to different levels of Islamic practice',
};

const RELIGIOUSNESS_CHRISTIANITY: ReligiousnessLabelTable = {
  HIGH: 'High — regular worship and shared Christian faith essential',
  MODERATE: 'Moderate — generally practicing Christianity',
  FLEXIBLE: 'Flexible — open to different levels of Christian practice',
};

const RELIGIOUSNESS_HINDUISM: ReligiousnessLabelTable = {
  HIGH: 'High — regular dharma / puja and shared Hindu values essential',
  MODERATE: 'Moderate — generally practicing Hinduism',
  FLEXIBLE: 'Flexible — open to different levels of Hindu practice',
};

const RELIGIOUSNESS_SIKHISM: ReligiousnessLabelTable = {
  HIGH: 'High — regular Nitnem / gurdwara and Sikh values essential',
  MODERATE: 'Moderate — generally practicing Sikhism',
  FLEXIBLE: 'Flexible — open to different levels of Sikh practice',
};

const RELIGIOUSNESS_BUDDHISM: ReligiousnessLabelTable = {
  HIGH: 'High — regular meditation / temple practice and Buddhist values essential',
  MODERATE: 'Moderate — generally practicing Buddhism',
  FLEXIBLE: 'Flexible — open to different levels of Buddhist practice',
};

const RELIGIOUSNESS_JUDAISM: ReligiousnessLabelTable = {
  HIGH: 'High — regular observance and shared Jewish faith essential',
  MODERATE: 'Moderate — generally practicing Judaism',
  FLEXIBLE: 'Flexible — open to different levels of Jewish practice',
};

const RELIGIOUSNESS_JAINISM: ReligiousnessLabelTable = {
  HIGH: 'High — strong ahimsa / Jain observance essential',
  MODERATE: 'Moderate — generally practicing Jainism',
  FLEXIBLE: 'Flexible — open to different levels of Jain practice',
};

const RELIGIOUSNESS_GENERIC: ReligiousnessLabelTable = {
  HIGH: 'High — regular faith practice and shared values essential',
  MODERATE: 'Moderate — generally practicing their faith',
  FLEXIBLE: 'Flexible — open to different levels of religious practice',
};

/** Context for religiousness copy: single preferred religion, else seeker profile religion. */
export function resolvePartnerReligiousnessReligion(
  seekerReligion: Religion | null | undefined,
  preferredReligions: Religion[] | null | undefined,
): Religion {
  const preferred = preferredReligions ?? [];
  if (preferred.length === 1) {
    const only = preferred[0];
    if (only) {
      return only;
    }
  }
  if (seekerReligion) {
    return seekerReligion;
  }
  return 'OTHER';
}

function getReligiousnessLabelTable(
  religion: Religion,
  seekerGender: Gender,
): ReligiousnessLabelTable {
  switch (religion) {
    case 'ISLAM':
      return seekerGender === 'FEMALE'
        ? RELIGIOUSNESS_ISLAM_FEMALE_SEEKER
        : RELIGIOUSNESS_ISLAM_MALE_SEEKER;
    case 'CHRISTIANITY':
      return RELIGIOUSNESS_CHRISTIANITY;
    case 'HINDUISM':
      return RELIGIOUSNESS_HINDUISM;
    case 'SIKHISM':
      return RELIGIOUSNESS_SIKHISM;
    case 'BUDDHISM':
      return RELIGIOUSNESS_BUDDHISM;
    case 'JUDAISM':
      return RELIGIOUSNESS_JUDAISM;
    case 'JAINISM':
      return RELIGIOUSNESS_JAINISM;
    case 'BAHAI':
    case 'OTHER':
    case 'PREFER_NOT_TO_SAY':
    default:
      return RELIGIOUSNESS_GENERIC;
  }
}

export function getPartnerReligiousnessFieldLabel(religion: Religion): string {
  if (religion === 'ISLAM') {
    return 'Expected level of Islamic practice';
  }
  if (religion === 'PREFER_NOT_TO_SAY') {
    return 'Expected level of faith practice';
  }
  return 'Expected religiousness level';
}

export function getPartnerReligiousnessLabel(
  seekerGender: Gender,
  value: PartnerReligiousnessLevel | null | undefined,
  context: { seekerReligion?: Religion | null; preferredReligions?: Religion[] | null },
): string | null {
  if (!value) {
    return null;
  }
  const religion = resolvePartnerReligiousnessReligion(
    context.seekerReligion,
    context.preferredReligions,
  );
  const table = getReligiousnessLabelTable(religion, seekerGender);
  return table[value] ?? value;
}

export function getPartnerReligiousnessOptions(
  seekerGender: Gender,
  context: { seekerReligion?: Religion | null; preferredReligions?: Religion[] | null },
): {
  value: PartnerReligiousnessLevel;
  label: string;
}[] {
  const religion = resolvePartnerReligiousnessReligion(
    context.seekerReligion,
    context.preferredReligions,
  );
  const table = getReligiousnessLabelTable(religion, seekerGender);
  return PARTNER_RELIGIOUSNESS_VALUES.map((value) => ({
    value,
    label: table[value],
  }));
}

export function isPartnerReligiousnessLevel(value: unknown): value is PartnerReligiousnessLevel {
  return (
    typeof value === 'string' && (PARTNER_RELIGIOUSNESS_VALUES as readonly string[]).includes(value)
  );
}

export type PartnerCustomExpectationsPatch = Pick<
  CustomExpectations,
  | 'religiousnessLevel'
  | 'complexionNotes'
  | 'educationNotes'
  | 'professionNotes'
  | 'specialQualities'
  | 'locationFlexibility'
>;

export function mergePartnerCustomExpectations(
  existing: CustomExpectations,
  patch: Partial<PartnerCustomExpectationsPatch>,
): CustomExpectations {
  return {
    ...existing,
    ...patch,
  };
}

const NOTE_FIELDS: (keyof PartnerCustomExpectationsPatch)[] = [
  'complexionNotes',
  'educationNotes',
  'professionNotes',
  'specialQualities',
];

export function validatePartnerCustomExpectationsNotes(
  custom: Partial<PartnerCustomExpectationsPatch>,
): string | null {
  for (const field of NOTE_FIELDS) {
    const raw = custom[field];
    if (typeof raw !== 'string') {
      continue;
    }
    if (countWords(raw) > PARTNER_PREFERENCE_NOTES_MAX_WORDS) {
      return `${field} must be at most ${PARTNER_PREFERENCE_NOTES_MAX_WORDS} words`;
    }
  }
  if (
    custom.religiousnessLevel !== undefined &&
    custom.religiousnessLevel !== null &&
    !isPartnerReligiousnessLevel(custom.religiousnessLevel)
  ) {
    return 'Invalid religiousnessLevel';
  }
  if (
    custom.locationFlexibility !== undefined &&
    custom.locationFlexibility !== null &&
    custom.locationFlexibility !== 'ANY_DISTRICT' &&
    custom.locationFlexibility !== ''
  ) {
    return 'Invalid locationFlexibility';
  }
  return null;
}

export function formatEnumList<T extends string>(values: T[], labels: Record<T, string>): string {
  if (values.length === 0) {
    return '—';
  }
  return values.map((v) => labels[v] ?? v).join(', ');
}

export function summarizePartnerLocationRead(partner: PartnerPreferenceDto | null): {
  countries: string;
  districts: string;
} {
  if (!partner) {
    return { countries: '—', districts: '—' };
  }
  return {
    countries: partner.preferredCountries.join(', ') || '—',
    districts: partner.preferredDistricts.join(', ') || '—',
  };
}

function formatMinHeightCm(cm: number | null | undefined): string {
  if (cm == null || cm <= 0) {
    return '—';
  }
  const totalInches = Math.round(cm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}′ ${inches}″`;
}

export function summarizePartnerPreferenceRead(
  partner: PartnerPreferenceDto,
  seekerGender: Gender,
  seekerReligion: Religion | null | undefined,
): {
  ageRange: string;
  minHeight: string;
  religiousness: string;
  complexion: string;
  marital: string;
  education: string;
  profession: string;
  familyStatus: string;
  countries: string;
  districts: string;
  religions: string;
  specialQualities: string;
} {
  const ce = partner.customExpectations ?? {};
  const religiousnessLevel = isPartnerReligiousnessLevel(ce.religiousnessLevel)
    ? ce.religiousnessLevel
    : null;

  return {
    ageRange: `${partner.minAge} – ${partner.maxAge}`,
    minHeight: formatMinHeightCm(partner.minHeightCm),
    religiousness:
      getPartnerReligiousnessLabel(seekerGender, religiousnessLevel, {
        seekerReligion,
        preferredReligions: partner.preferredReligions,
      }) ?? '—',
    complexion:
      [
        formatEnumList(partner.complexions, COMPLEXION_PREFERENCE_LABELS),
        typeof ce.complexionNotes === 'string' && ce.complexionNotes.trim()
          ? ce.complexionNotes.trim()
          : '',
      ]
        .filter(Boolean)
        .join(' — ') || '—',
    marital: formatEnumList(partner.maritalStatuses, MARITAL_STATUS_LABELS),
    education:
      [
        formatEnumList(partner.educationLevels, EDUCATION_PREFERENCE_LABELS),
        typeof ce.educationNotes === 'string' ? ce.educationNotes.trim() : '',
      ]
        .filter(Boolean)
        .join(' — ') || '—',
    profession:
      [
        formatEnumList(partner.occupations, OCCUPATION_PREFERENCE_LABELS),
        typeof ce.professionNotes === 'string' ? ce.professionNotes.trim() : '',
      ]
        .filter(Boolean)
        .join(' — ') || '—',
    familyStatus: partner.familyStatus
      ? FAMILY_STATUS_PREFERENCE_LABELS[partner.familyStatus]
      : '—',
    countries: partner.preferredCountries.join(', ') || '—',
    districts:
      ce.locationFlexibility === 'ANY_DISTRICT'
        ? 'Any district'
        : partner.preferredDistricts.join(', ') || '—',
    religions: partner.preferredReligions.map((r) => RELIGION_LABELS[r] ?? r).join(', ') || '—',
    specialQualities:
      typeof ce.specialQualities === 'string' && ce.specialQualities.trim()
        ? ce.specialQualities.trim()
        : '—',
  };
}
