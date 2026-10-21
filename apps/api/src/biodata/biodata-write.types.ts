import type {
  ComplexionPreference,
  EducationPreference,
  EmploymentTypePreference,
  FamilyStatusPreference,
  Gender,
  MaritalStatus,
  OccupationPreference,
  Religion,
  ResidenceTypePreference,
  SiblingPositionPreference,
} from '@soulsync/db';

export type MyPreferenceWritePayload = {
  gender: Gender;
  complexion?: ComplexionPreference | null;
  heightCm?: number | null;
  educationLevel?: EducationPreference | null;
  occupation?: OccupationPreference | null;
  maritalStatus?: MaritalStatus | null;
  monthlyIncome?: number | null;
  incomeCurrency?: string;
  residenceType?: ResidenceTypePreference | null;
  familyStatus?: FamilyStatusPreference | null;
  siblingCount?: number | null;
  siblingPosition?: SiblingPositionPreference | null;
  district?: string | null;
  country?: string | null;
  religion?: Religion | null;
  denomination?: string | null;
  community?: string | null;
  motherTongue?: string | null;
  employmentTypes?: EmploymentTypePreference[];
  willingToRelocate?: boolean;
  openToAbroad?: boolean;
  customExpectations?: Record<string, unknown>;
  isActive?: boolean;
};

export type PartnerPreferenceWritePayload = {
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
  customExpectations: Record<string, unknown>;
};
