import type { CustomExpectations, PartnerPreferenceDto } from './partner-preference';
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
} from './partner-preference';

export const BIODATA_SECTION_IDS = [
  'basic',
  'location',
  'education_career',
  'faith',
  'privacy',
  'my_attributes',
  'partner',
] as const;

export type BiodataSectionId = (typeof BIODATA_SECTION_IDS)[number];

export const PHOTO_VISIBILITY_VALUES = ['PUBLIC', 'MEMBERS_ONLY', 'ON_CONSENT', 'HIDDEN'] as const;

export type PhotoVisibility = (typeof PHOTO_VISIBILITY_VALUES)[number];

export interface BiodataProfileDto {
  id: string;
  userId: string;
  tenantId: string;
  displayName: string;
  gender: Gender;
  dateOfBirth: string;
  heightCm: number | null;
  maritalStatus: MaritalStatus;
  country: string;
  stateRegion: string | null;
  city: string;
  postalCode: string | null;
  motherTongue: string | null;
  education: string | null;
  occupation: string | null;
  bio: string | null;
  religion: Religion;
  denomination: string | null;
  community: string | null;
  religiousPractice: string | null;
  photoVisibility: PhotoVisibility;
  isDiscoverable: boolean;
  showContactOnlyToAccepted: boolean;
  hideFromContacts: boolean;
  guardianManaged: boolean;
  completenessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface BiodataMyPreferenceDto {
  id: string;
  profileId: string;
  userId: string;
  tenantId: string;
  gender: Gender;
  complexion: ComplexionPreference | null;
  heightCm: number | null;
  educationLevel: EducationPreference | null;
  occupation: OccupationPreference | null;
  maritalStatus: MaritalStatus | null;
  monthlyIncome: number | null;
  incomeCurrency: string;
  residenceType: ResidenceTypePreference | null;
  familyStatus: FamilyStatusPreference | null;
  siblingCount: number | null;
  siblingPosition: SiblingPositionPreference | null;
  district: string | null;
  country: string | null;
  religion: Religion | null;
  denomination: string | null;
  community: string | null;
  motherTongue: string | null;
  employmentTypes: EmploymentTypePreference[];
  willingToRelocate: boolean;
  openToAbroad: boolean;
  customExpectations: CustomExpectations;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BiodataMeDto {
  profile: BiodataProfileDto;
  myPreference: BiodataMyPreferenceDto | null;
  partnerPreference: PartnerPreferenceDto | null;
}

export type BiodataBasicSectionPatch = {
  displayName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  heightCm?: number | null;
  maritalStatus?: MaritalStatus;
};

export type BiodataLocationSectionPatch = {
  country?: string;
  stateRegion?: string | null;
  city?: string;
  postalCode?: string | null;
  motherTongue?: string | null;
};

export type BiodataEducationCareerSectionPatch = {
  education?: string | null;
  occupation?: string | null;
  bio?: string | null;
};

export type BiodataFaithSectionPatch = {
  religion?: Religion;
  denomination?: string | null;
  community?: string | null;
  religiousPractice?: string | null;
};

export type BiodataPrivacySectionPatch = {
  photoVisibility?: PhotoVisibility;
  isDiscoverable?: boolean;
  showContactOnlyToAccepted?: boolean;
  hideFromContacts?: boolean;
  guardianManaged?: boolean;
};

export type BiodataMyAttributesSectionPatch = Partial<
  Omit<
    BiodataMyPreferenceDto,
    'id' | 'profileId' | 'userId' | 'tenantId' | 'createdAt' | 'updatedAt'
  >
>;

export type BiodataPartnerSectionPatch = Partial<
  Omit<
    PartnerPreferenceDto,
    'id' | 'profileId' | 'userId' | 'tenantId' | 'preferredGender' | 'createdAt' | 'updatedAt'
  >
>;

export type BiodataSectionPatchBody =
  | BiodataBasicSectionPatch
  | BiodataLocationSectionPatch
  | BiodataEducationCareerSectionPatch
  | BiodataFaithSectionPatch
  | BiodataPrivacySectionPatch
  | BiodataMyAttributesSectionPatch
  | BiodataPartnerSectionPatch;
