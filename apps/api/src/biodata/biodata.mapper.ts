import type { MyPreference, PartnerPreference, Profile } from '@soulsync/db';
import type {
  BiodataMeDto,
  BiodataMyPreferenceDto,
  BiodataProfileDto,
} from '@soulsync/shared-types/biodata';
import type { PartnerPreferenceDto } from '@soulsync/shared-types/partner-preference';
import type { FieldEncryptionService } from '../crypto/field-encryption.service';
import type { CustomExpectations } from '@soulsync/shared-types/partner-preference';

export function encryptProfileForStorage(
  crypto: FieldEncryptionService,
  data: Partial<Profile>,
): Partial<Profile> {
  return {
    ...data,
    displayName:
      data.displayName !== undefined
        ? (crypto.encryptString(data.displayName) ?? data.displayName)
        : undefined,
    city: data.city !== undefined ? (crypto.encryptString(data.city) ?? data.city) : undefined,
    country:
      data.country !== undefined ? (crypto.encryptString(data.country) ?? data.country) : undefined,
    motherTongue:
      data.motherTongue !== undefined ? crypto.encryptString(data.motherTongue) : undefined,
    education: data.education !== undefined ? crypto.encryptString(data.education) : undefined,
    occupation: data.occupation !== undefined ? crypto.encryptString(data.occupation) : undefined,
    bio: data.bio !== undefined ? crypto.encryptString(data.bio) : undefined,
    denomination:
      data.denomination !== undefined ? crypto.encryptString(data.denomination) : undefined,
    community: data.community !== undefined ? crypto.encryptString(data.community) : undefined,
    religiousPractice:
      data.religiousPractice !== undefined
        ? crypto.encryptString(data.religiousPractice)
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
    maritalStatus: profile.maritalStatus,
    country: crypto.decryptString(profile.country) ?? profile.country,
    city: crypto.decryptString(profile.city) ?? profile.city,
    motherTongue: crypto.decryptString(profile.motherTongue),
    education: crypto.decryptString(profile.education),
    occupation: crypto.decryptString(profile.occupation),
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
