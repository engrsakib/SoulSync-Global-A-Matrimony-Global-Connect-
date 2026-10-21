import type { CustomExpectations, PartnerPreferenceDto } from './partner-preference';
import type {
  BiodataFamilyHeritageSectionPatch,
  FamilyEconomicClass,
  FamilyRelativeEntry,
} from './family-heritage';
import type { IslamMaslak } from './religion-branches';
import type {
  BiodataIslamShariaSectionPatch,
  ClothingAboveAnkles,
  HijabPurdah,
  MahramCompliance,
  PrayerRegularity,
  QuranRecitationLevel,
  SunnahBeardStatus,
} from './islam-sharia';
import type {
  BloodGroup,
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
import type { DiscoveryReligionMode } from './biodata-discovery-settings';
import { countWords } from './word-limit';

export const BIODATA_SECTION_IDS = [
  'basic',
  'faith',
  'islam_sharia',
  'location',
  'education_career',
  'privacy',
  'family_heritage',
  'my_attributes',
  'partner',
  'partner_location',
  'guardian_contact',
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
  weightKg: number | null;
  bloodGroup: BloodGroup | null;
  hasChronicConditions: boolean | null;
  chronicConditionsDetail: string | null;
  maritalStatus: MaritalStatus;
  country: string;
  stateRegion: string | null;
  city: string;
  postalCode: string | null;
  /** IANA zone for daily check-in calendar day (from location country or member override). */
  checkInTimeZone: string | null;
  locationDetails: string | null;
  motherTongue: string | null;
  education: string | null;
  degreeName: string | null;
  degreeMajor: string | null;
  institution: string | null;
  graduationYear: number | null;
  occupation: string | null;
  employer: string | null;
  yearsExperience: number | null;
  workLocation: string | null;
  bio: string | null;
  religion: Religion;
  denomination: string | null;
  community: string | null;
  religiousPractice: string | null;
  islamMaslak: IslamMaslak | null;
  photoVisibility: PhotoVisibility;
  isDiscoverable: boolean;
  showContactOnlyToAccepted: boolean;
  hideFromContacts: boolean;
  guardianManaged: boolean;
  discoveryReligionMode: DiscoveryReligionMode;
  discoveryReligionAllowList: Religion[];
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianMobile: string | null;
  candidateMobile: string | null;
  guardianTelegram: string | null;
  guardianWhatsApp: string | null;
  candidateTelegram: string | null;
  candidateWhatsApp: string | null;
  marriagePledgeInformationTrue: boolean;
  marriagePledgeGuardianConsent: boolean;
  marriagePledgeFalseInfoAccountability: boolean;
  marriagePledgeMarkAfterMarriage: boolean;
  marriagePledgesAcceptedAt: string | null;
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
  /** Verified account email for guardian contact section (read-only in UI). */
  accountEmail: string | null;
}

export type BiodataBasicSectionPatch = {
  displayName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  bloodGroup?: BloodGroup | null;
  hasChronicConditions?: boolean | null;
  chronicConditionsDetail?: string | null;
  maritalStatus?: MaritalStatus;
  /** Stored on `MyPreference`. */
  complexion?: ComplexionPreference | null;
};

export type BiodataLocationSectionPatch = {
  country?: string;
  stateRegion?: string | null;
  city?: string;
  postalCode?: string | null;
  checkInTimeZone?: string | null;
  locationDetails?: string | null;
  motherTongue?: string | null;
};

/** Word limits for profile `locationDetails` (house, village, etc.). */
export const LOCATION_DETAILS_MIN_WORDS = 10;
export const LOCATION_DETAILS_MAX_WORDS = 300;

export function validateProfileLocationDetails(value: string | null | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    return `Location details are required (${LOCATION_DETAILS_MIN_WORDS}–${LOCATION_DETAILS_MAX_WORDS} words)`;
  }
  const words = countWords(trimmed);
  if (words < LOCATION_DETAILS_MIN_WORDS) {
    return `Location details must be at least ${LOCATION_DETAILS_MIN_WORDS} words (${words} entered)`;
  }
  if (words > LOCATION_DETAILS_MAX_WORDS) {
    return `Location details must be at most ${LOCATION_DETAILS_MAX_WORDS} words`;
  }
  return null;
}

export type BiodataEducationCareerSectionPatch = {
  education?: string | null;
  degreeName?: string | null;
  degreeMajor?: string | null;
  institution?: string | null;
  graduationYear?: number | null;
  occupation?: string | null;
  employer?: string | null;
  yearsExperience?: number | null;
  workLocation?: string | null;
  bio?: string | null;
  /** Stored on `MyPreference`; optional. */
  monthlyIncome?: number | null;
  incomeCurrency?: string;
};

export type BiodataFaithSectionPatch = {
  religion?: Religion;
  denomination?: string | null;
  community?: string | null;
  religiousPractice?: string | null;
  islamMaslak?: IslamMaslak | null;
};

export type BiodataPrivacySectionPatch = {
  photoVisibility?: PhotoVisibility;
  isDiscoverable?: boolean;
  showContactOnlyToAccepted?: boolean;
  hideFromContacts?: boolean;
  guardianManaged?: boolean;
  discoveryReligionMode?: DiscoveryReligionMode;
  discoveryReligionAllowList?: Religion[];
};

export type { BiodataFamilyHeritageSectionPatch };
export type { BiodataIslamShariaSectionPatch };

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

export type BiodataGuardianContactSectionPatch = {
  guardianName?: string;
  guardianRelationship?: string;
  guardianMobile?: string;
  candidateMobile?: string;
  guardianTelegram?: string | null;
  guardianWhatsApp?: string | null;
  candidateTelegram?: string | null;
  candidateWhatsApp?: string | null;
  marriagePledgeInformationTrue?: boolean;
  marriagePledgeGuardianConsent?: boolean;
  marriagePledgeFalseInfoAccountability?: boolean;
  marriagePledgeMarkAfterMarriage?: boolean;
};

export type BiodataSectionPatchBody =
  | BiodataBasicSectionPatch
  | BiodataLocationSectionPatch
  | BiodataEducationCareerSectionPatch
  | BiodataFaithSectionPatch
  | BiodataPrivacySectionPatch
  | BiodataFamilyHeritageSectionPatch
  | BiodataIslamShariaSectionPatch
  | BiodataMyAttributesSectionPatch
  | BiodataPartnerSectionPatch
  | BiodataGuardianContactSectionPatch;
