import { countWords } from './word-limit';

export const FAMILY_ECONOMIC_CLASS_VALUES = [
  'UPPER_CLASS',
  'UPPER_MIDDLE_CLASS',
  'MIDDLE_CLASS',
  'LOWER_MIDDLE_CLASS',
  'LOWER_CLASS',
] as const;

export type FamilyEconomicClass = (typeof FAMILY_ECONOMIC_CLASS_VALUES)[number];

export const FAMILY_ECONOMIC_CLASS_LABELS: Record<FamilyEconomicClass, string> = {
  UPPER_CLASS: 'Upper class',
  UPPER_MIDDLE_CLASS: 'Upper middle',
  MIDDLE_CLASS: 'Middle class',
  LOWER_MIDDLE_CLASS: 'Lower middle',
  LOWER_CLASS: 'Struggling / lower income',
};

export const FAMILY_RELATIVE_RELATIONSHIP_VALUES = [
  'BROTHER',
  'SISTER',
  'PATERNAL_UNCLE',
  'MATERNAL_UNCLE',
  'PATERNAL_AUNT',
  'MATERNAL_AUNT',
  'OTHER',
] as const;

export type FamilyRelativeRelationship = (typeof FAMILY_RELATIVE_RELATIONSHIP_VALUES)[number];

export const FAMILY_RELATIVE_RELATIONSHIP_LABELS: Record<FamilyRelativeRelationship, string> = {
  BROTHER: 'Brother',
  SISTER: 'Sister',
  PATERNAL_UNCLE: 'Paternal uncle',
  MATERNAL_UNCLE: 'Maternal uncle',
  PATERNAL_AUNT: 'Paternal aunt',
  MATERNAL_AUNT: 'Maternal aunt',
  OTHER: 'Other relative',
};

export interface FamilyRelativeEntry {
  id: string;
  relationship: FamilyRelativeRelationship;
  name: string;
  education: string;
  profession: string;
}

export const FAMILY_HERITAGE_MAX_RELATIVES = 20;
export const FAMILY_HERITAGE_TEXT_MAX_WORDS = 300;

export type FamilyHeritageProfileFields = {
  fatherIsAlive: boolean | null;
  motherIsAlive: boolean | null;
  fatherProfession: string | null;
  motherProfession: string | null;
  brotherCount: number | null;
  sisterCount: number | null;
  unclesOccupations: string | null;
  residenceDescription: string | null;
  familyEconomicClass: FamilyEconomicClass | null;
  familyRelatives: FamilyRelativeEntry[];
};

export type BiodataFamilyHeritageSectionPatch = Partial<{
  fatherIsAlive: boolean | null;
  motherIsAlive: boolean | null;
  fatherProfession: string | null;
  motherProfession: string | null;
  brotherCount: number | null;
  sisterCount: number | null;
  unclesOccupations: string | null;
  residenceDescription: string | null;
  familyEconomicClass: FamilyEconomicClass | null;
  familyRelatives: FamilyRelativeEntry[];
}>;

export function formatParentAliveDisplay(value: boolean | null | undefined): string {
  if (value === true) {
    return 'Yes, alive';
  }
  if (value === false) {
    return 'No, deceased';
  }
  return '—';
}

function trimOrNull(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim();
  return text || null;
}

function assertMaxWords(text: string | null, field: string): void {
  if (text != null && countWords(text) > FAMILY_HERITAGE_TEXT_MAX_WORDS) {
    throw new Error(`${field} must be at most ${FAMILY_HERITAGE_TEXT_MAX_WORDS} words`);
  }
}

export function parseFamilyRelativeEntry(raw: unknown): FamilyRelativeEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const relationship = item.relationship;
  if (
    typeof relationship !== 'string' ||
    !(FAMILY_RELATIVE_RELATIONSHIP_VALUES as readonly string[]).includes(relationship)
  ) {
    return null;
  }
  const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : '';
  if (!id) {
    return null;
  }
  return {
    id,
    relationship: relationship as FamilyRelativeRelationship,
    name: trimOrNull(item.name) ?? '',
    education: trimOrNull(item.education) ?? '',
    profession: trimOrNull(item.profession) ?? '',
  };
}

export function parseFamilyRelatives(raw: unknown): FamilyRelativeEntry[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const parsed = raw
    .map(parseFamilyRelativeEntry)
    .filter((e): e is FamilyRelativeEntry => e != null);
  return parsed.slice(0, FAMILY_HERITAGE_MAX_RELATIVES);
}

/** JSON stored on Profile: plain array or encrypted wrapper `{ relatives: [...] }`. */
export function familyRelativesFromProfileJson(raw: unknown): FamilyRelativeEntry[] {
  if (Array.isArray(raw)) {
    return parseFamilyRelatives(raw);
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>;
    if (Array.isArray(record.relatives)) {
      return parseFamilyRelatives(record.relatives);
    }
  }
  return [];
}

export function familyRelativesToStoragePayload(relatives: FamilyRelativeEntry[]): {
  relatives: FamilyRelativeEntry[];
} {
  return { relatives: parseFamilyRelatives(relatives) };
}

export function validateFamilyHeritageTextFields(fields: {
  fatherProfession?: string | null;
  motherProfession?: string | null;
  unclesOccupations?: string | null;
  residenceDescription?: string | null;
}): void {
  assertMaxWords(fields.fatherProfession ?? null, 'fatherProfession');
  assertMaxWords(fields.motherProfession ?? null, 'motherProfession');
  assertMaxWords(fields.unclesOccupations ?? null, 'unclesOccupations');
  assertMaxWords(fields.residenceDescription ?? null, 'residenceDescription');
}
