/** Frontend-safe enum mirrors (aligned with Prisma schema). */

export const GENDER_VALUES = ['MALE', 'FEMALE'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const MARITAL_STATUS_VALUES = [
  'NEVER_MARRIED',
  'DIVORCED',
  'WIDOWED',
  'SEPARATED',
  'ANNULLED',
] as const;
export type MaritalStatus = (typeof MARITAL_STATUS_VALUES)[number];

export const RELIGION_VALUES = [
  'ISLAM',
  'HINDUISM',
  'CHRISTIANITY',
  'SIKHISM',
  'BUDDHISM',
  'JUDAISM',
  'JAINISM',
  'BAHAI',
  'OTHER',
  'PREFER_NOT_TO_SAY',
] as const;
export type Religion = (typeof RELIGION_VALUES)[number];

export const COMPLEXION_PREFERENCE_VALUES = [
  'FAIR',
  'VERY_FAIR',
  'WHEATISH',
  'DARK',
  'ANY',
] as const;
export type ComplexionPreference = (typeof COMPLEXION_PREFERENCE_VALUES)[number];

export const EDUCATION_PREFERENCE_VALUES = [
  'SECONDARY',
  'HSC',
  'GRADUATION',
  'POST_GRADUATION',
  'MADRASAH',
  'PROFESSIONAL',
  'ANY',
] as const;
export type EducationPreference = (typeof EDUCATION_PREFERENCE_VALUES)[number];

export const OCCUPATION_PREFERENCE_VALUES = [
  'SOFTWARE_ENGINEER',
  'BUSINESS',
  'GOVERNMENT_JOB',
  'DOCTOR',
  'TEACHER',
  'ENGINEER',
  'ACCOUNTANT',
  'OTHER',
  'ANY',
] as const;
export type OccupationPreference = (typeof OCCUPATION_PREFERENCE_VALUES)[number];

export const RESIDENCE_TYPE_PREFERENCE_VALUES = [
  'OWN_HOUSE',
  'RENTED',
  'FAMILY_OWNED',
  'ANY',
] as const;
export type ResidenceTypePreference = (typeof RESIDENCE_TYPE_PREFERENCE_VALUES)[number];

export const FAMILY_STATUS_PREFERENCE_VALUES = [
  'UPPER_CLASS',
  'HIGH_MIDDLE_CLASS',
  'MIDDLE_CLASS',
  'ANY',
] as const;
export type FamilyStatusPreference = (typeof FAMILY_STATUS_PREFERENCE_VALUES)[number];

export const SIBLING_POSITION_PREFERENCE_VALUES = [
  'ELDEST',
  'YOUNGEST',
  'MIDDLE',
  'ONLY_CHILD',
  'ANY',
] as const;
export type SiblingPositionPreference = (typeof SIBLING_POSITION_PREFERENCE_VALUES)[number];

export const EMPLOYMENT_TYPE_PREFERENCE_VALUES = [
  'FULL_TIME',
  'PART_TIME',
  'SELF_EMPLOYED',
  'STUDENT',
  'HOMEMAKER',
  'UNEMPLOYED',
  'ANY',
] as const;
export type EmploymentTypePreference = (typeof EMPLOYMENT_TYPE_PREFERENCE_VALUES)[number];

/** Religion- and lifestyle-specific keys validated by the API / frontend. */
export interface CustomExpectations {
  praysRegularly?: boolean | string;
  wearsHijabOrParda?: boolean | string;
  allowWifeToWork?: boolean;
  socialMediaPhotosAllowed?: boolean;
  beardPreference?: boolean;
  smokingHabit?: boolean | string;
  dietaryPreference?: string;
  [key: string]: unknown;
}

export interface PartnerPreferenceDto {
  id: string;
  profileId: string;
  userId: string;
  tenantId: string;
  preferredGender: Gender;
  minAge: number;
  maxAge: number;
  complexions: ComplexionPreference[];
  minHeightCm: number | null;
  maxHeightCm: number | null;
  educationLevels: EducationPreference[];
  occupations: OccupationPreference[];
  maritalStatuses: MaritalStatus[];
  minMonthlyIncome: number | null;
  maxMonthlyIncome: number | null;
  incomeCurrency: string;
  residenceType: ResidenceTypePreference | null;
  familyStatus: FamilyStatusPreference | null;
  siblingCountPreference: number | null;
  siblingPositionPreference: SiblingPositionPreference | null;
  preferredDistricts: string[];
  preferredCountries: string[];
  preferredReligions: Religion[];
  preferredDenominations: string[];
  preferredCommunities: string[];
  preferredMotherTongues: string[];
  employmentTypes: EmploymentTypePreference[];
  willingToRelocate: boolean;
  openToAbroad: boolean;
  requiresVerifiedProfile: boolean;
  minProfileCompleteness: number;
  isActive: boolean;
  customExpectations: CustomExpectations;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerPreferenceInput {
  minAge?: number;
  maxAge?: number;
  complexions?: ComplexionPreference[];
  minHeightCm?: number | null;
  maxHeightCm?: number | null;
  educationLevels?: EducationPreference[];
  occupations?: OccupationPreference[];
  maritalStatuses?: MaritalStatus[];
  minMonthlyIncome?: number | null;
  maxMonthlyIncome?: number | null;
  incomeCurrency?: string;
  residenceType?: ResidenceTypePreference | null;
  familyStatus?: FamilyStatusPreference | null;
  siblingCountPreference?: number | null;
  siblingPositionPreference?: SiblingPositionPreference | null;
  preferredDistricts?: string[];
  preferredCountries?: string[];
  preferredReligions?: Religion[];
  preferredDenominations?: string[];
  preferredCommunities?: string[];
  preferredMotherTongues?: string[];
  employmentTypes?: EmploymentTypePreference[];
  willingToRelocate?: boolean;
  openToAbroad?: boolean;
  requiresVerifiedProfile?: boolean;
  minProfileCompleteness?: number;
  isActive?: boolean;
  customExpectations?: CustomExpectations;
}

export type UpdatePartnerPreferenceInput = Partial<CreatePartnerPreferenceInput>;
