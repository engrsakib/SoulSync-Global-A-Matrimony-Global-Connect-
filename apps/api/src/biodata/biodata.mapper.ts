import type { MyPreference, PartnerPreference, Profile } from '@soulsync/db';
import type {
  BiodataMeDto,
  BiodataMyPreferenceDto,
  BiodataProfileDto,
} from '@soulsync/shared-types/biodata';
import type { PartnerPreferenceDto } from '@soulsync/shared-types/partner-preference';
import type { FieldEncryptionService } from '../crypto/field-encryption.service';
import type { CustomExpectations } from '@soulsync/shared-types/partner-preference';
import {
  familyRelativesFromProfileJson,
  familyRelativesToStoragePayload,
  parseFamilyRelatives,
  type FamilyRelativeEntry,
} from '@soulsync/shared-types/family-heritage';
import type { Prisma } from '@soulsync/db';

function decryptFamilyRelatives(
  crypto: FieldEncryptionService,
  value: Prisma.JsonValue,
): FamilyRelativeEntry[] {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (typeof record._encrypted === 'string') {
      const decoded = crypto.decryptJson(record);
      return familyRelativesFromProfileJson(decoded);
    }
  }
  return familyRelativesFromProfileJson(value);
}

export function encryptProfileForStorage(
  crypto: FieldEncryptionService,
  data: Partial<Profile>,
): Prisma.ProfileUpdateInput {
  return {
    ...data,
    displayName:
      data.displayName !== undefined
        ? (crypto.encryptString(data.displayName) ?? data.displayName)
        : undefined,
    city: data.city !== undefined ? (crypto.encryptString(data.city) ?? data.city) : undefined,
    country:
      data.country !== undefined ? (crypto.encryptString(data.country) ?? data.country) : undefined,
    stateRegion:
      data.stateRegion !== undefined ? crypto.encryptString(data.stateRegion) : undefined,
    postalCode: data.postalCode !== undefined ? crypto.encryptString(data.postalCode) : undefined,
    motherTongue:
      data.motherTongue !== undefined ? crypto.encryptString(data.motherTongue) : undefined,
    education: data.education !== undefined ? crypto.encryptString(data.education) : undefined,
    degreeName: data.degreeName !== undefined ? crypto.encryptString(data.degreeName) : undefined,
    degreeMajor:
      data.degreeMajor !== undefined ? crypto.encryptString(data.degreeMajor) : undefined,
    institution:
      data.institution !== undefined ? crypto.encryptString(data.institution) : undefined,
    graduationYear: data.graduationYear !== undefined ? data.graduationYear : undefined,
    occupation: data.occupation !== undefined ? crypto.encryptString(data.occupation) : undefined,
    employer: data.employer !== undefined ? crypto.encryptString(data.employer) : undefined,
    yearsExperience: data.yearsExperience !== undefined ? data.yearsExperience : undefined,
    workLocation:
      data.workLocation !== undefined ? crypto.encryptString(data.workLocation) : undefined,
    bio: data.bio !== undefined ? crypto.encryptString(data.bio) : undefined,
    denomination:
      data.denomination !== undefined ? crypto.encryptString(data.denomination) : undefined,
    community: data.community !== undefined ? crypto.encryptString(data.community) : undefined,
    religiousPractice:
      data.religiousPractice !== undefined
        ? crypto.encryptString(data.religiousPractice)
        : undefined,
    chronicConditionsDetail:
      data.chronicConditionsDetail !== undefined
        ? crypto.encryptString(data.chronicConditionsDetail)
        : undefined,
    fatherProfession:
      data.fatherProfession !== undefined ? crypto.encryptString(data.fatherProfession) : undefined,
    motherProfession:
      data.motherProfession !== undefined ? crypto.encryptString(data.motherProfession) : undefined,
    unclesOccupations:
      data.unclesOccupations !== undefined
        ? crypto.encryptString(data.unclesOccupations)
        : undefined,
    residenceDescription:
      data.residenceDescription !== undefined
        ? crypto.encryptString(data.residenceDescription)
        : undefined,
    familyRelatives:
      data.familyRelatives !== undefined
        ? (crypto.encryptJson(
            familyRelativesToStoragePayload(parseFamilyRelatives(data.familyRelatives)),
          ) as Prisma.InputJsonValue)
        : undefined,
  };
}

export function decryptProfileToDto(
  crypto: FieldEncryptionService,
  profile: Profile,
): BiodataProfileDto {
  return {
    id: profile.id,
    userId: profile.userId,
    tenantId: profile.tenantId,
    displayName: crypto.decryptString(profile.displayName) ?? profile.displayName,
    gender: profile.gender,
    dateOfBirth: profile.dateOfBirth.toISOString(),
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    bloodGroup: profile.bloodGroup,
    hasChronicConditions: profile.hasChronicConditions,
    chronicConditionsDetail: crypto.decryptString(profile.chronicConditionsDetail),
    maritalStatus: profile.maritalStatus,
    country: crypto.decryptString(profile.country) ?? profile.country,
    stateRegion: crypto.decryptString(profile.stateRegion),
    city: crypto.decryptString(profile.city) ?? profile.city,
    postalCode: crypto.decryptString(profile.postalCode),
    motherTongue: crypto.decryptString(profile.motherTongue),
    education: crypto.decryptString(profile.education),
    degreeName: crypto.decryptString(profile.degreeName),
    degreeMajor: crypto.decryptString(profile.degreeMajor),
    institution: crypto.decryptString(profile.institution),
    graduationYear: profile.graduationYear,
    occupation: crypto.decryptString(profile.occupation),
    employer: crypto.decryptString(profile.employer),
    yearsExperience: profile.yearsExperience,
    workLocation: crypto.decryptString(profile.workLocation),
    bio: crypto.decryptString(profile.bio),
    religion: profile.religion,
    denomination: crypto.decryptString(profile.denomination),
    community: crypto.decryptString(profile.community),
    religiousPractice: crypto.decryptString(profile.religiousPractice),
    photoVisibility: profile.photoVisibility,
    isDiscoverable: profile.isDiscoverable,
    showContactOnlyToAccepted: profile.showContactOnlyToAccepted,
    hideFromContacts: profile.hideFromContacts,
    guardianManaged: profile.guardianManaged,
    fatherIsAlive: profile.fatherIsAlive,
    motherIsAlive: profile.motherIsAlive,
    fatherProfession: crypto.decryptString(profile.fatherProfession),
    motherProfession: crypto.decryptString(profile.motherProfession),
    brotherCount: profile.brotherCount,
    sisterCount: profile.sisterCount,
    unclesOccupations: crypto.decryptString(profile.unclesOccupations),
    residenceDescription: crypto.decryptString(profile.residenceDescription),
    familyEconomicClass: profile.familyEconomicClass,
    familyRelatives: decryptFamilyRelatives(crypto, profile.familyRelatives),
    completenessScore: profile.completenessScore,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export function encryptMyPreferenceForStorage(
  crypto: FieldEncryptionService,
  data: {
    district?: string | null;
    country?: string | null;
    denomination?: string | null;
    community?: string | null;
    motherTongue?: string | null;
    customExpectations?: Record<string, unknown>;
  },
): {
  district?: string | null;
  country?: string | null;
  denomination?: string | null;
  community?: string | null;
  motherTongue?: string | null;
  customExpectations?: Record<string, unknown>;
} {
  return {
    district: data.district !== undefined ? crypto.encryptString(data.district) : undefined,
    country: data.country !== undefined ? crypto.encryptString(data.country) : undefined,
    denomination:
      data.denomination !== undefined ? crypto.encryptString(data.denomination) : undefined,
    community: data.community !== undefined ? crypto.encryptString(data.community) : undefined,
    motherTongue:
      data.motherTongue !== undefined ? crypto.encryptString(data.motherTongue) : undefined,
    customExpectations:
      data.customExpectations !== undefined
        ? crypto.encryptJson(data.customExpectations)
        : undefined,
  };
}

export function decryptMyPreferenceToDto(
  crypto: FieldEncryptionService,
  record: MyPreference,
): BiodataMyPreferenceDto {
  const customExpectations: CustomExpectations = crypto.decryptJson(record.customExpectations);
  return {
    id: record.id,
    profileId: record.profileId,
    userId: record.userId,
    tenantId: record.tenantId,
    gender: record.gender,
    complexion: record.complexion,
    heightCm: record.heightCm,
    educationLevel: record.educationLevel,
    occupation: record.occupation,
    maritalStatus: record.maritalStatus,
    monthlyIncome: record.monthlyIncome?.toNumber() ?? null,
    incomeCurrency: record.incomeCurrency,
    residenceType: record.residenceType,
    familyStatus: record.familyStatus,
    siblingCount: record.siblingCount,
    siblingPosition: record.siblingPosition,
    district: crypto.decryptString(record.district),
    country: crypto.decryptString(record.country),
    religion: record.religion,
    denomination: crypto.decryptString(record.denomination),
    community: crypto.decryptString(record.community),
    motherTongue: crypto.decryptString(record.motherTongue),
    employmentTypes: record.employmentTypes,
    willingToRelocate: record.willingToRelocate,
    openToAbroad: record.openToAbroad,
    customExpectations,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function encryptPartnerPreferenceForStorage(
  crypto: FieldEncryptionService,
  data: {
    preferredDistricts?: string[];
    preferredCountries?: string[];
    preferredDenominations?: string[];
    preferredCommunities?: string[];
    preferredMotherTongues?: string[];
    customExpectations?: Record<string, unknown>;
  },
): typeof data {
  return {
    preferredDistricts:
      data.preferredDistricts !== undefined
        ? crypto.encryptStringArray(data.preferredDistricts)
        : undefined,
    preferredCountries:
      data.preferredCountries !== undefined
        ? crypto.encryptStringArray(data.preferredCountries)
        : undefined,
    preferredDenominations:
      data.preferredDenominations !== undefined
        ? crypto.encryptStringArray(data.preferredDenominations)
        : undefined,
    preferredCommunities:
      data.preferredCommunities !== undefined
        ? crypto.encryptStringArray(data.preferredCommunities)
        : undefined,
    preferredMotherTongues:
      data.preferredMotherTongues !== undefined
        ? crypto.encryptStringArray(data.preferredMotherTongues)
        : undefined,
    customExpectations:
      data.customExpectations !== undefined
        ? crypto.encryptJson(data.customExpectations)
        : undefined,
  };
}

export function decryptPartnerPreferenceToDto(
  crypto: FieldEncryptionService,
  record: PartnerPreference,
): PartnerPreferenceDto {
  const customExpectations: CustomExpectations = crypto.decryptJson(record.customExpectations);
  return {
    id: record.id,
    profileId: record.profileId,
    userId: record.userId,
    tenantId: record.tenantId,
    preferredGender: record.preferredGender,
    minAge: record.minAge,
    maxAge: record.maxAge,
    complexions: record.complexions,
    minHeightCm: record.minHeightCm,
    maxHeightCm: record.maxHeightCm,
    educationLevels: record.educationLevels,
    occupations: record.occupations,
    maritalStatuses: record.maritalStatuses,
    minMonthlyIncome: record.minMonthlyIncome?.toNumber() ?? null,
    maxMonthlyIncome: record.maxMonthlyIncome?.toNumber() ?? null,
    incomeCurrency: record.incomeCurrency,
    residenceType: record.residenceType,
    familyStatus: record.familyStatus,
    siblingCountPreference: record.siblingCountPreference,
    siblingPositionPreference: record.siblingPositionPreference,
    preferredDistricts: crypto.decryptStringArray(record.preferredDistricts),
    preferredCountries: crypto.decryptStringArray(record.preferredCountries),
    preferredReligions: record.preferredReligions,
    preferredDenominations: crypto.decryptStringArray(record.preferredDenominations),
    preferredCommunities: crypto.decryptStringArray(record.preferredCommunities),
    preferredMotherTongues: crypto.decryptStringArray(record.preferredMotherTongues),
    employmentTypes: record.employmentTypes,
    willingToRelocate: record.willingToRelocate,
    openToAbroad: record.openToAbroad,
    requiresVerifiedProfile: record.requiresVerifiedProfile,
    minProfileCompleteness: record.minProfileCompleteness,
    isActive: record.isActive,
    customExpectations,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function toBiodataMeDto(
  crypto: FieldEncryptionService,
  profile: Profile,
  myPreference: MyPreference | null,
  partnerPreference: PartnerPreference | null,
): BiodataMeDto {
  return {
    profile: decryptProfileToDto(crypto, profile),
    myPreference: myPreference ? decryptMyPreferenceToDto(crypto, myPreference) : null,
    partnerPreference: partnerPreference
      ? decryptPartnerPreferenceToDto(crypto, partnerPreference)
      : null,
  };
}
