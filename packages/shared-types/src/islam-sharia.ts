import type { Gender } from './partner-preference';
import { countWords } from './word-limit';

export const PRAYER_REGULARITY_VALUES = ['REGULAR_FIVE_TIMES', 'NOT_REGULAR'] as const;
export type PrayerRegularity = (typeof PRAYER_REGULARITY_VALUES)[number];

export const PRAYER_REGULARITY_LABELS: Record<PrayerRegularity, string> = {
  REGULAR_FIVE_TIMES: 'Yes — five daily prayers, Alhamdulillah',
  NOT_REGULAR: 'Not regular yet',
};

export const SUNNAH_BEARD_STATUS_VALUES = ['KEEPS_BEARD', 'NOT_REGULAR_YET'] as const;
export type SunnahBeardStatus = (typeof SUNNAH_BEARD_STATUS_VALUES)[number];

export const SUNNAH_BEARD_STATUS_LABELS: Record<SunnahBeardStatus, string> = {
  KEEPS_BEARD: 'Yes — I keep a Sunnah beard',
  NOT_REGULAR_YET: 'No — not regular yet',
};

export const QURAN_RECITATION_LEVEL_VALUES = [
  'WITH_TAJWEED',
  'IMPROVING',
  'PARTIAL',
  'LEARNING',
  'NOT_YET',
] as const;
export type QuranRecitationLevel = (typeof QURAN_RECITATION_LEVEL_VALUES)[number];

export const QURAN_RECITATION_LEVEL_LABELS: Record<QuranRecitationLevel, string> = {
  WITH_TAJWEED: 'Yes — with tajweed',
  IMPROVING: 'Yes — improving tajweed',
  PARTIAL: 'Partial / selected surahs',
  LEARNING: 'Still learning',
  NOT_YET: 'Not yet',
};

export const CLOTHING_ABOVE_ANKLES_VALUES = ['ALWAYS', 'MOSTLY', 'SOMETIMES', 'NO'] as const;
export type ClothingAboveAnkles = (typeof CLOTHING_ABOVE_ANKLES_VALUES)[number];

export const CLOTHING_ABOVE_ANKLES_LABELS: Record<ClothingAboveAnkles, string> = {
  ALWAYS: 'Yes — always above the ankles',
  MOSTLY: 'Mostly',
  SOMETIMES: 'Sometimes',
  NO: 'No',
};

export const MAHRAM_COMPLIANCE_VALUES = ['STRICT', 'TRY_MY_BEST', 'STILL_LEARNING', 'NO'] as const;
export type MahramCompliance = (typeof MAHRAM_COMPLIANCE_VALUES)[number];

export const MAHRAM_COMPLIANCE_LABELS: Record<MahramCompliance, string> = {
  STRICT: 'Yes — strictly observe mahram rules',
  TRY_MY_BEST: 'I try my best',
  STILL_LEARNING: 'Still learning',
  NO: 'No',
};

export const HIJAB_PURDAH_VALUES = [
  'FULL_NIQAB',
  'BURQA_HIJAB',
  'MODEST_CLOTHING',
  'NOT_APPLICABLE',
] as const;
export type HijabPurdah = (typeof HIJAB_PURDAH_VALUES)[number];

export const HIJAB_PURDAH_LABELS: Record<HijabPurdah, string> = {
  FULL_NIQAB: 'Full purdah (niqab)',
  BURQA_HIJAB: 'Burqa and hijab',
  MODEST_CLOTHING: 'General modest clothing',
  NOT_APPLICABLE: 'Not applicable',
};

export const ISLAM_SHARIA_TEXT_MAX_WORDS = 300;

export type IslamShariaProfileFields = {
  prayerRegularity: PrayerRegularity | null;
  missedFardPrayersNotes: string | null;
  aqeedahNotes: string | null;
  sunnahBeardStatus: SunnahBeardStatus | null;
  beardDetails: string | null;
  usualOutdoorClothing: string | null;
  quranRecitationLevel: QuranRecitationLevel | null;
  favoriteIslamicBooks: string | null;
  favoriteScholars: string | null;
  clothingAboveAnkles: ClothingAboveAnkles | null;
  mahramCompliance: MahramCompliance | null;
  entertainmentHabits: string | null;
  dawahInvolvement: string | null;
  quranHifzNotes: string | null;
  incomeFullyHalal: boolean | null;
  hijabPurdah: HijabPurdah | null;
};

export type BiodataIslamShariaSectionPatch = Partial<IslamShariaProfileFields>;

export function shouldShowBeardFields(gender: Gender): boolean {
  return gender === 'MALE';
}

export function shouldShowHijabField(gender: Gender): boolean {
  return gender === 'FEMALE';
}

function assertMaxWords(text: string | null, field: string): void {
  if (text != null && countWords(text) > ISLAM_SHARIA_TEXT_MAX_WORDS) {
    throw new Error(`${field} must be at most ${ISLAM_SHARIA_TEXT_MAX_WORDS} words`);
  }
}

export function validateIslamShariaTextFields(fields: {
  missedFardPrayersNotes?: string | null;
  aqeedahNotes?: string | null;
  beardDetails?: string | null;
  usualOutdoorClothing?: string | null;
  favoriteIslamicBooks?: string | null;
  favoriteScholars?: string | null;
  entertainmentHabits?: string | null;
  dawahInvolvement?: string | null;
  quranHifzNotes?: string | null;
}): void {
  assertMaxWords(fields.missedFardPrayersNotes ?? null, 'missedFardPrayersNotes');
  assertMaxWords(fields.aqeedahNotes ?? null, 'aqeedahNotes');
  assertMaxWords(fields.beardDetails ?? null, 'beardDetails');
  assertMaxWords(fields.usualOutdoorClothing ?? null, 'usualOutdoorClothing');
  assertMaxWords(fields.favoriteIslamicBooks ?? null, 'favoriteIslamicBooks');
  assertMaxWords(fields.favoriteScholars ?? null, 'favoriteScholars');
  assertMaxWords(fields.entertainmentHabits ?? null, 'entertainmentHabits');
  assertMaxWords(fields.dawahInvolvement ?? null, 'dawahInvolvement');
  assertMaxWords(fields.quranHifzNotes ?? null, 'quranHifzNotes');
}

export function formatEnumLabel<T extends string>(
  value: T | null | undefined,
  labels: Record<T, string>,
): string {
  if (value == null) {
    return '—';
  }
  return labels[value] ?? value;
}

export function formatBooleanYes(value: boolean | null | undefined): string {
  if (value === true) {
    return 'Yes';
  }
  if (value === false) {
    return 'No';
  }
  return '—';
}
