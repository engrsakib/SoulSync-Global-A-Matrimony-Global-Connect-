import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Gender,
  Prisma,
  type MyPreference,
  type PartnerPreference,
  type Profile,
} from '@soulsync/db';
import type { BiodataMeDto, BiodataSectionId } from '@soulsync/shared-types/biodata';
import { BIODATA_SECTION_IDS } from '@soulsync/shared-types/biodata';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CUSTOM_EXPECTATIONS_MAX_BYTES,
  getAgeRangeError,
  getHeightRangeError,
  getIncomeRangeError,
  resolvePreferredGender,
} from '../partner-preferences/partner-preference.rules';
import { computeBiodataCompleteness } from './biodata-completeness';
import { readOptionalStringField, readStringField } from './biodata-body.util';
import type {
  MyPreferenceWritePayload,
  PartnerPreferenceWritePayload,
} from './biodata-write.types';
import {
  encryptMyPreferenceForStorage,
  encryptPartnerPreferenceForStorage,
  encryptProfileForStorage,
  toBiodataMeDto,
} from './biodata.mapper';

@Injectable()
export class BiodataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldEncryptionService,
  ) {}

  async getMine(userId: string): Promise<BiodataMeDto> {
    const bundle = await this.loadBundle(userId);
    return toBiodataMeDto(
      this.crypto,
      bundle.profile,
      bundle.myPreference,
      bundle.partnerPreference,
    );
  }

  async patchSection(
    userId: string,
    sectionId: string,
    body: Record<string, unknown>,
  ): Promise<BiodataMeDto> {
    if (!BIODATA_SECTION_IDS.includes(sectionId as BiodataSectionId)) {
      throw new BadRequestException(`Unknown biodata section: ${sectionId}`);
    }

    const profile = await this.requireProfile(userId);

    switch (sectionId as BiodataSectionId) {
      case 'basic':
        await this.patchBasic(profile, body);
        break;
      case 'location':
        await this.patchLocation(profile, body);
        break;
      case 'education_career':
        await this.patchEducationCareer(profile, body);
        break;
      case 'faith':
        await this.patchFaith(profile, body);
        break;
      case 'privacy':
        await this.patchPrivacy(profile, body);
        break;
      case 'my_attributes':
        await this.patchMyAttributes(profile, body);
        break;
      case 'partner':
        await this.patchPartner(profile, body);
        break;
      default:
        throw new BadRequestException(`Unknown biodata section: ${sectionId}`);
    }

    await this.refreshCompleteness(userId);
    return this.getMine(userId);
  }

  private async loadBundle(userId: string) {
    const profile = await this.prisma.client.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const [myPreference, partnerPreference] = await Promise.all([
      this.prisma.client.myPreference.findUnique({ where: { userId } }),
      this.prisma.client.partnerPreference.findUnique({ where: { userId } }),
    ]);
    return { profile, myPreference, partnerPreference };
  }

  private async requireProfile(userId: string): Promise<Profile> {
    const profile = await this.prisma.client.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  private async refreshCompleteness(userId: string): Promise<void> {
    const dto = await this.getMine(userId);
    const score = computeBiodataCompleteness(dto);
    await this.prisma.client.profile.update({
      where: { userId },
      data: { completenessScore: score },
    });
  }

  private async patchBasic(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const data: Partial<Profile> = {};
    if (body.displayName !== undefined) {
      data.displayName = readStringField(body.displayName, 'displayName').trim();
    }
    if (body.gender !== undefined) {
      data.gender = body.gender as Gender;
    }
    if (body.dateOfBirth !== undefined) {
      data.dateOfBirth = new Date(readStringField(body.dateOfBirth, 'dateOfBirth'));
    }
    if (body.heightCm !== undefined) {
      data.heightCm = body.heightCm === null ? null : Number(body.heightCm);
    }
    if (body.maritalStatus !== undefined) {
      data.maritalStatus = body.maritalStatus as Profile['maritalStatus'];
    }
    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchLocation(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const data: Partial<Profile> = {};
    if (body.country !== undefined) {
      data.country = readStringField(body.country, 'country').trim();
    }
    if (body.city !== undefined) {
      data.city = readStringField(body.city, 'city').trim();
    }
    if (body.motherTongue !== undefined) {
      data.motherTongue = readOptionalStringField(body.motherTongue);
    }
    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchEducationCareer(
    profile: Profile,
    body: Record<string, unknown>,
  ): Promise<void> {
    const data: Partial<Profile> = {};
    if (body.education !== undefined) {
      data.education = readOptionalStringField(body.education);
    }
    if (body.occupation !== undefined) {
      data.occupation = readOptionalStringField(body.occupation);
    }
    if (body.bio !== undefined) {
      data.bio = readOptionalStringField(body.bio);
    }
    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchFaith(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const data: Partial<Profile> = {};
    if (body.religion !== undefined) {
      data.religion = body.religion as Profile['religion'];
    }
    if (body.denomination !== undefined) {
      data.denomination = readOptionalStringField(body.denomination);
    }
    if (body.community !== undefined) {
      data.community = readOptionalStringField(body.community);
    }
    if (body.religiousPractice !== undefined) {
      data.religiousPractice = readOptionalStringField(body.religiousPractice);
    }
    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchPrivacy(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const data: Partial<Profile> = {};
    if (body.photoVisibility !== undefined) {
      data.photoVisibility = body.photoVisibility as Profile['photoVisibility'];
    }
    if (body.isDiscoverable !== undefined) {
      data.isDiscoverable = Boolean(body.isDiscoverable);
    }
    if (body.showContactOnlyToAccepted !== undefined) {
      data.showContactOnlyToAccepted = Boolean(body.showContactOnlyToAccepted);
    }
    if (body.hideFromContacts !== undefined) {
      data.hideFromContacts = Boolean(body.hideFromContacts);
    }
    if (body.guardianManaged !== undefined) {
      data.guardianManaged = Boolean(body.guardianManaged);
    }
    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data,
    });
  }

  private async patchMyAttributes(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const existing = await this.prisma.client.myPreference.findUnique({
      where: { userId: profile.userId },
    });

    const writable = this.buildMyPreferenceWritable(body, existing);
    const encrypted = encryptMyPreferenceForStorage(this.crypto, {
      district: writable.district,
      country: writable.country,
      denomination: writable.denomination,
      community: writable.community,
      motherTongue: writable.motherTongue,
      customExpectations: writable.customExpectations,
    });
    const data = this.toMyPreferenceDbRow(writable, encrypted);

    if (existing) {
      await this.prisma.client.myPreference.update({
        where: { userId: profile.userId },
        data,
      });
      return;
    }

    await this.prisma.client.myPreference.create({
      data: {
        ...(data as Prisma.MyPreferenceUncheckedCreateInput),
        profileId: profile.id,
        userId: profile.userId,
        tenantId: profile.tenantId,
      },
    });
  }

  private toMyPreferenceDbRow(
    writable: MyPreferenceWritePayload,
    encrypted: ReturnType<typeof encryptMyPreferenceForStorage>,
  ): Prisma.MyPreferenceUncheckedUpdateInput {
    return {
      gender: writable.gender,
      complexion: writable.complexion ?? null,
      heightCm: writable.heightCm ?? null,
      educationLevel: writable.educationLevel ?? null,
      occupation: writable.occupation ?? null,
      maritalStatus: writable.maritalStatus ?? null,
      monthlyIncome:
        writable.monthlyIncome == null ? null : new Prisma.Decimal(writable.monthlyIncome),
      incomeCurrency: writable.incomeCurrency ?? 'USD',
      residenceType: writable.residenceType ?? null,
      familyStatus: writable.familyStatus ?? null,
      siblingCount: writable.siblingCount ?? null,
      siblingPosition: writable.siblingPosition ?? null,
      district: encrypted.district !== undefined ? encrypted.district : (writable.district ?? null),
      country: encrypted.country !== undefined ? encrypted.country : (writable.country ?? null),
      religion: writable.religion ?? null,
      denomination:
        encrypted.denomination !== undefined
          ? encrypted.denomination
          : (writable.denomination ?? null),
      community:
        encrypted.community !== undefined ? encrypted.community : (writable.community ?? null),
      motherTongue:
        encrypted.motherTongue !== undefined
          ? encrypted.motherTongue
          : (writable.motherTongue ?? null),
      employmentTypes: writable.employmentTypes ?? [],
      willingToRelocate: writable.willingToRelocate ?? false,
      openToAbroad: writable.openToAbroad ?? false,
      customExpectations: (encrypted.customExpectations ??
        writable.customExpectations ??
        {}) as Prisma.InputJsonValue,
      isActive: writable.isActive ?? true,
    };
  }

  private buildMyPreferenceWritable(
    body: Record<string, unknown>,
    existing: MyPreference | null,
  ): MyPreferenceWritePayload {
    if (body.customExpectations !== undefined) {
      const size = Buffer.byteLength(JSON.stringify(body.customExpectations), 'utf8');
      if (size > CUSTOM_EXPECTATIONS_MAX_BYTES) {
        throw new BadRequestException('customExpectations payload is too large');
      }
    }

    return {
      gender: (body.gender ?? existing?.gender ?? Gender.MALE) as Gender,
      complexion:
        body.complexion !== undefined
          ? (body.complexion as MyPreference['complexion'])
          : existing?.complexion,
      heightCm:
        body.heightCm !== undefined
          ? body.heightCm === null
            ? null
            : Number(body.heightCm)
          : existing?.heightCm,
      educationLevel:
        body.educationLevel !== undefined
          ? (body.educationLevel as MyPreference['educationLevel'])
          : existing?.educationLevel,
      occupation:
        body.occupation !== undefined
          ? (body.occupation as MyPreference['occupation'])
          : existing?.occupation,
      maritalStatus:
        body.maritalStatus !== undefined
          ? (body.maritalStatus as MyPreference['maritalStatus'])
          : existing?.maritalStatus,
      monthlyIncome:
        body.monthlyIncome !== undefined
          ? body.monthlyIncome === null
            ? null
            : Number(body.monthlyIncome)
          : (existing?.monthlyIncome?.toNumber() ?? null),
      incomeCurrency:
        body.incomeCurrency !== undefined
          ? readStringField(body.incomeCurrency, 'incomeCurrency')
          : (existing?.incomeCurrency ?? 'USD'),
      residenceType:
        body.residenceType !== undefined
          ? (body.residenceType as MyPreference['residenceType'])
          : existing?.residenceType,
      familyStatus:
        body.familyStatus !== undefined
          ? (body.familyStatus as MyPreference['familyStatus'])
          : existing?.familyStatus,
      siblingCount:
        body.siblingCount !== undefined
          ? body.siblingCount === null
            ? null
            : Number(body.siblingCount)
          : existing?.siblingCount,
      siblingPosition:
        body.siblingPosition !== undefined
          ? (body.siblingPosition as MyPreference['siblingPosition'])
          : existing?.siblingPosition,
      district:
        body.district !== undefined
          ? readOptionalStringField(body.district)
          : this.crypto.decryptString(existing?.district ?? null),
      country:
        body.country !== undefined
          ? readOptionalStringField(body.country)
          : this.crypto.decryptString(existing?.country ?? null),
      religion:
        body.religion !== undefined
          ? (body.religion as MyPreference['religion'])
          : existing?.religion,
      denomination:
        body.denomination !== undefined
          ? readOptionalStringField(body.denomination)
          : this.crypto.decryptString(existing?.denomination ?? null),
      community:
        body.community !== undefined
          ? readOptionalStringField(body.community)
          : this.crypto.decryptString(existing?.community ?? null),
      motherTongue:
        body.motherTongue !== undefined
          ? readOptionalStringField(body.motherTongue)
          : this.crypto.decryptString(existing?.motherTongue ?? null),
      employmentTypes:
        body.employmentTypes !== undefined
          ? (body.employmentTypes as MyPreference['employmentTypes'])
          : (existing?.employmentTypes ?? []),
      willingToRelocate:
        body.willingToRelocate !== undefined
          ? Boolean(body.willingToRelocate)
          : (existing?.willingToRelocate ?? false),
      openToAbroad:
        body.openToAbroad !== undefined
          ? Boolean(body.openToAbroad)
          : (existing?.openToAbroad ?? false),
      customExpectations:
        body.customExpectations !== undefined
          ? (body.customExpectations as Record<string, unknown>)
          : this.crypto.decryptJson(existing?.customExpectations),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : (existing?.isActive ?? true),
    };
  }

  private async patchPartner(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const existing = await this.prisma.client.partnerPreference.findUnique({
      where: { userId: profile.userId },
    });

    const minAge = body.minAge !== undefined ? Number(body.minAge) : (existing?.minAge ?? 21);
    const maxAge = body.maxAge !== undefined ? Number(body.maxAge) : (existing?.maxAge ?? 35);
    const minHeightCm =
      body.minHeightCm !== undefined
        ? body.minHeightCm === null
          ? null
          : Number(body.minHeightCm)
        : (existing?.minHeightCm ?? null);
    const maxHeightCm =
      body.maxHeightCm !== undefined
        ? body.maxHeightCm === null
          ? null
          : Number(body.maxHeightCm)
        : (existing?.maxHeightCm ?? null);
    const minMonthlyIncome =
      body.minMonthlyIncome !== undefined
        ? body.minMonthlyIncome === null
          ? null
          : Number(body.minMonthlyIncome)
        : (existing?.minMonthlyIncome?.toNumber() ?? null);
    const maxMonthlyIncome =
      body.maxMonthlyIncome !== undefined
        ? body.maxMonthlyIncome === null
          ? null
          : Number(body.maxMonthlyIncome)
        : (existing?.maxMonthlyIncome?.toNumber() ?? null);

    const ageError = getAgeRangeError(minAge, maxAge);
    if (ageError) {
      throw new BadRequestException(ageError);
    }
    const heightError = getHeightRangeError(minHeightCm, maxHeightCm);
    if (heightError) {
      throw new BadRequestException(heightError);
    }
    const incomeError = getIncomeRangeError(minMonthlyIncome, maxMonthlyIncome);
    if (incomeError) {
      throw new BadRequestException(incomeError);
    }
    if (body.customExpectations !== undefined) {
      const size = Buffer.byteLength(JSON.stringify(body.customExpectations), 'utf8');
      if (size > CUSTOM_EXPECTATIONS_MAX_BYTES) {
        throw new BadRequestException('customExpectations payload is too large');
      }
    }

    const preferredGender = resolvePreferredGender(profile.gender);
    const writable: PartnerPreferenceWritePayload = {
      preferredGender,
      minAge,
      maxAge,
      complexions:
        body.complexions !== undefined
          ? (body.complexions as PartnerPreference['complexions'])
          : (existing?.complexions ?? []),
      minHeightCm,
      maxHeightCm,
      educationLevels:
        body.educationLevels !== undefined
          ? (body.educationLevels as PartnerPreference['educationLevels'])
          : (existing?.educationLevels ?? []),
      occupations:
        body.occupations !== undefined
          ? (body.occupations as PartnerPreference['occupations'])
          : (existing?.occupations ?? []),
      maritalStatuses:
        body.maritalStatuses !== undefined
          ? (body.maritalStatuses as PartnerPreference['maritalStatuses'])
          : (existing?.maritalStatuses ?? []),
      minMonthlyIncome,
      maxMonthlyIncome,
      incomeCurrency:
        body.incomeCurrency !== undefined
          ? readStringField(body.incomeCurrency, 'incomeCurrency')
          : (existing?.incomeCurrency ?? 'USD'),
      residenceType:
        body.residenceType !== undefined
          ? (body.residenceType as PartnerPreference['residenceType'])
          : (existing?.residenceType ?? null),
      familyStatus:
        body.familyStatus !== undefined
          ? (body.familyStatus as PartnerPreference['familyStatus'])
          : (existing?.familyStatus ?? null),
      siblingCountPreference:
        body.siblingCountPreference !== undefined
          ? body.siblingCountPreference === null
            ? null
            : Number(body.siblingCountPreference)
          : (existing?.siblingCountPreference ?? null),
      siblingPositionPreference:
        body.siblingPositionPreference !== undefined
          ? (body.siblingPositionPreference as PartnerPreference['siblingPositionPreference'])
          : (existing?.siblingPositionPreference ?? null),
      preferredDistricts:
        body.preferredDistricts !== undefined
          ? (body.preferredDistricts as string[])
          : this.crypto.decryptStringArray(existing?.preferredDistricts ?? []),
      preferredCountries:
        body.preferredCountries !== undefined
          ? (body.preferredCountries as string[])
          : this.crypto.decryptStringArray(existing?.preferredCountries ?? []),
      preferredReligions:
        body.preferredReligions !== undefined
          ? (body.preferredReligions as PartnerPreference['preferredReligions'])
          : (existing?.preferredReligions ?? []),
      preferredDenominations:
        body.preferredDenominations !== undefined
          ? (body.preferredDenominations as string[])
          : this.crypto.decryptStringArray(existing?.preferredDenominations ?? []),
      preferredCommunities:
        body.preferredCommunities !== undefined
          ? (body.preferredCommunities as string[])
          : this.crypto.decryptStringArray(existing?.preferredCommunities ?? []),
      preferredMotherTongues:
        body.preferredMotherTongues !== undefined
          ? (body.preferredMotherTongues as string[])
          : this.crypto.decryptStringArray(existing?.preferredMotherTongues ?? []),
      employmentTypes:
        body.employmentTypes !== undefined
          ? (body.employmentTypes as PartnerPreference['employmentTypes'])
          : (existing?.employmentTypes ?? []),
      willingToRelocate:
        body.willingToRelocate !== undefined
          ? Boolean(body.willingToRelocate)
          : (existing?.willingToRelocate ?? false),
      openToAbroad:
        body.openToAbroad !== undefined
          ? Boolean(body.openToAbroad)
          : (existing?.openToAbroad ?? false),
      requiresVerifiedProfile:
        body.requiresVerifiedProfile !== undefined
          ? Boolean(body.requiresVerifiedProfile)
          : (existing?.requiresVerifiedProfile ?? false),
      minProfileCompleteness:
        body.minProfileCompleteness !== undefined
          ? Number(body.minProfileCompleteness)
          : (existing?.minProfileCompleteness ?? 0),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : (existing?.isActive ?? true),
      customExpectations:
        body.customExpectations !== undefined
          ? (body.customExpectations as Record<string, unknown>)
          : this.crypto.decryptJson(existing?.customExpectations),
    };

    const encrypted = encryptPartnerPreferenceForStorage(this.crypto, {
      preferredDistricts: writable.preferredDistricts,
      preferredCountries: writable.preferredCountries,
      preferredDenominations: writable.preferredDenominations,
      preferredCommunities: writable.preferredCommunities,
      preferredMotherTongues: writable.preferredMotherTongues,
      customExpectations: writable.customExpectations,
    });
    const data = this.toPartnerPreferenceDbRow(writable, encrypted);

    if (existing) {
      await this.prisma.client.partnerPreference.update({
        where: { userId: profile.userId },
        data,
      });
      return;
    }

    await this.prisma.client.partnerPreference.create({
      data: {
        ...(data as Prisma.PartnerPreferenceUncheckedCreateInput),
        profileId: profile.id,
        userId: profile.userId,
        tenantId: profile.tenantId,
      },
    });
  }

  private toPartnerPreferenceDbRow(
    writable: PartnerPreferenceWritePayload,
    encrypted: ReturnType<typeof encryptPartnerPreferenceForStorage>,
  ): Prisma.PartnerPreferenceUncheckedUpdateInput {
    return {
      preferredGender: writable.preferredGender,
      minAge: writable.minAge,
      maxAge: writable.maxAge,
      complexions: writable.complexions,
      minHeightCm: writable.minHeightCm,
      maxHeightCm: writable.maxHeightCm,
      educationLevels: writable.educationLevels,
      occupations: writable.occupations,
      maritalStatuses: writable.maritalStatuses,
      minMonthlyIncome:
        writable.minMonthlyIncome == null ? null : new Prisma.Decimal(writable.minMonthlyIncome),
      maxMonthlyIncome:
        writable.maxMonthlyIncome == null ? null : new Prisma.Decimal(writable.maxMonthlyIncome),
      incomeCurrency: writable.incomeCurrency,
      residenceType: writable.residenceType,
      familyStatus: writable.familyStatus,
      siblingCountPreference: writable.siblingCountPreference,
      siblingPositionPreference: writable.siblingPositionPreference,
      preferredDistricts:
        encrypted.preferredDistricts !== undefined
          ? encrypted.preferredDistricts
          : writable.preferredDistricts,
      preferredCountries:
        encrypted.preferredCountries !== undefined
          ? encrypted.preferredCountries
          : writable.preferredCountries,
      preferredReligions: writable.preferredReligions,
      preferredDenominations:
        encrypted.preferredDenominations !== undefined
          ? encrypted.preferredDenominations
          : writable.preferredDenominations,
      preferredCommunities:
        encrypted.preferredCommunities !== undefined
          ? encrypted.preferredCommunities
          : writable.preferredCommunities,
      preferredMotherTongues:
        encrypted.preferredMotherTongues !== undefined
          ? encrypted.preferredMotherTongues
          : writable.preferredMotherTongues,
      employmentTypes: writable.employmentTypes,
      willingToRelocate: writable.willingToRelocate,
      openToAbroad: writable.openToAbroad,
      requiresVerifiedProfile: writable.requiresVerifiedProfile,
      minProfileCompleteness: writable.minProfileCompleteness,
      isActive: writable.isActive,
      customExpectations: (encrypted.customExpectations ??
        writable.customExpectations ??
        {}) as Prisma.InputJsonValue,
    };
  }
}
