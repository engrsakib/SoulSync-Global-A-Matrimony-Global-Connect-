import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type PartnerPreference } from '@soulsync/db';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePartnerPreferenceDto } from './dto/create-partner-preference.dto';
import type { PartnerPreferenceResponseDto } from './dto/partner-preference-response.dto';
import type { UpdatePartnerPreferenceDto } from './dto/update-partner-preference.dto';
import {
  CUSTOM_EXPECTATIONS_MAX_BYTES,
  getAgeRangeError,
  getHeightRangeError,
  getIncomeRangeError,
  resolvePreferredGender,
} from './partner-preference.rules';

type WritablePreferenceFields = Omit<
  Prisma.PartnerPreferenceUncheckedCreateInput,
  'id' | 'profileId' | 'userId' | 'tenantId' | 'preferredGender'
>;

@Injectable()
export class PartnerPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertForUser(
    userId: string,
    dto: CreatePartnerPreferenceDto,
  ): Promise<PartnerPreferenceResponseDto> {
    const profile = await this.requireProfile(userId);
    const existing = await this.prisma.client.partnerPreference.findUnique({
      where: { userId },
    });

    const minAge = dto.minAge ?? existing?.minAge ?? 21;
    const maxAge = dto.maxAge ?? existing?.maxAge ?? 35;
    const minHeightCm =
      dto.minHeightCm !== undefined ? dto.minHeightCm : (existing?.minHeightCm ?? null);
    const maxHeightCm =
      dto.maxHeightCm !== undefined ? dto.maxHeightCm : (existing?.maxHeightCm ?? null);
    const minMonthlyIncome = this.resolveIncome(dto.minMonthlyIncome, existing?.minMonthlyIncome);
    const maxMonthlyIncome = this.resolveIncome(dto.maxMonthlyIncome, existing?.maxMonthlyIncome);

    this.assertBusinessRules({
      minAge,
      maxAge,
      minHeightCm,
      maxHeightCm,
      minMonthlyIncome,
      maxMonthlyIncome,
      customExpectations: dto.customExpectations,
    });

    const preferredGender = resolvePreferredGender(profile.gender);
    const data = this.buildWritableData(dto, existing, {
      minAge,
      maxAge,
      minHeightCm,
      maxHeightCm,
      minMonthlyIncome,
      maxMonthlyIncome,
    });

    const record = await this.prisma.client.partnerPreference.upsert({
      where: { userId },
      create: {
        profileId: profile.id,
        userId: profile.userId,
        tenantId: profile.tenantId,
        preferredGender,
        ...data,
      },
      update: {
        preferredGender,
        ...data,
      },
    });

    return this.toResponse(record);
  }

  async findMine(userId: string): Promise<PartnerPreferenceResponseDto> {
    const preference = await this.prisma.client.partnerPreference.findUnique({
      where: { userId },
    });
    if (!preference) {
      throw new NotFoundException('Partner preference not found');
    }
    return this.toResponse(preference);
  }

  async updateForUser(
    userId: string,
    dto: UpdatePartnerPreferenceDto,
  ): Promise<PartnerPreferenceResponseDto> {
    const profile = await this.requireProfile(userId);
    const existing = await this.prisma.client.partnerPreference.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException('Partner preference not found');
    }

    const minAge = dto.minAge ?? existing.minAge;
    const maxAge = dto.maxAge ?? existing.maxAge;
    const minHeightCm = dto.minHeightCm !== undefined ? dto.minHeightCm : existing.minHeightCm;
    const maxHeightCm = dto.maxHeightCm !== undefined ? dto.maxHeightCm : existing.maxHeightCm;
    const minMonthlyIncome = this.resolveIncome(dto.minMonthlyIncome, existing.minMonthlyIncome);
    const maxMonthlyIncome = this.resolveIncome(dto.maxMonthlyIncome, existing.maxMonthlyIncome);

    this.assertBusinessRules({
      minAge,
      maxAge,
      minHeightCm,
      maxHeightCm,
      minMonthlyIncome,
      maxMonthlyIncome,
      customExpectations: dto.customExpectations,
    });

    const preferredGender = resolvePreferredGender(profile.gender);
    const data = this.buildWritableData(dto, existing, {
      minAge,
      maxAge,
      minHeightCm,
      maxHeightCm,
      minMonthlyIncome,
      maxMonthlyIncome,
    });

    const record = await this.prisma.client.partnerPreference.update({
      where: { userId },
      data: {
        preferredGender,
        ...data,
      },
    });

    return this.toResponse(record);
  }

  private async requireProfile(userId: string) {
    const profile = await this.prisma.client.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Complete your profile before setting partner preferences');
    }
    return profile;
  }

  private assertBusinessRules(input: {
    minAge: number;
    maxAge: number;
    minHeightCm: number | null;
    maxHeightCm: number | null;
    minMonthlyIncome: number | null;
    maxMonthlyIncome: number | null;
    customExpectations?: Record<string, unknown>;
  }): void {
    const ageError = getAgeRangeError(input.minAge, input.maxAge);
    if (ageError) {
      throw new BadRequestException(ageError);
    }
    const heightError = getHeightRangeError(input.minHeightCm, input.maxHeightCm);
    if (heightError) {
      throw new BadRequestException(heightError);
    }
    const incomeError = getIncomeRangeError(input.minMonthlyIncome, input.maxMonthlyIncome);
    if (incomeError) {
      throw new BadRequestException(incomeError);
    }
    if (input.customExpectations !== undefined) {
      const size = Buffer.byteLength(JSON.stringify(input.customExpectations), 'utf8');
      if (size > CUSTOM_EXPECTATIONS_MAX_BYTES) {
        throw new BadRequestException('customExpectations payload is too large');
      }
    }
  }

  private resolveIncome(
    incoming: number | null | undefined,
    existing: Prisma.Decimal | null | undefined,
  ): number | null {
    if (incoming !== undefined) {
      return incoming;
    }
    if (existing == null) {
      return null;
    }
    return existing.toNumber();
  }

  private buildWritableData(
    dto: CreatePartnerPreferenceDto | UpdatePartnerPreferenceDto,
    existing: PartnerPreference | null,
    resolved: {
      minAge: number;
      maxAge: number;
      minHeightCm: number | null;
      maxHeightCm: number | null;
      minMonthlyIncome: number | null;
      maxMonthlyIncome: number | null;
    },
  ): WritablePreferenceFields {
    return {
      minAge: resolved.minAge,
      maxAge: resolved.maxAge,
      complexions: dto.complexions ?? existing?.complexions ?? [],
      minHeightCm: resolved.minHeightCm,
      maxHeightCm: resolved.maxHeightCm,
      educationLevels: dto.educationLevels ?? existing?.educationLevels ?? [],
      occupations: dto.occupations ?? existing?.occupations ?? [],
      maritalStatuses: dto.maritalStatuses ?? existing?.maritalStatuses ?? [],
      minMonthlyIncome: this.toDecimal(resolved.minMonthlyIncome),
      maxMonthlyIncome: this.toDecimal(resolved.maxMonthlyIncome),
      incomeCurrency: dto.incomeCurrency ?? existing?.incomeCurrency ?? 'USD',
      residenceType:
        dto.residenceType !== undefined ? dto.residenceType : (existing?.residenceType ?? null),
      familyStatus:
        dto.familyStatus !== undefined ? dto.familyStatus : (existing?.familyStatus ?? null),
      siblingCountPreference:
        dto.siblingCountPreference !== undefined
          ? dto.siblingCountPreference
          : (existing?.siblingCountPreference ?? null),
      siblingPositionPreference:
        dto.siblingPositionPreference !== undefined
          ? dto.siblingPositionPreference
          : (existing?.siblingPositionPreference ?? null),
      preferredDistricts: dto.preferredDistricts ?? existing?.preferredDistricts ?? [],
      preferredCountries: dto.preferredCountries ?? existing?.preferredCountries ?? [],
      preferredReligions: dto.preferredReligions ?? existing?.preferredReligions ?? [],
      preferredDenominations: dto.preferredDenominations ?? existing?.preferredDenominations ?? [],
      preferredCommunities: dto.preferredCommunities ?? existing?.preferredCommunities ?? [],
      preferredMotherTongues: dto.preferredMotherTongues ?? existing?.preferredMotherTongues ?? [],
      employmentTypes: dto.employmentTypes ?? existing?.employmentTypes ?? [],
      willingToRelocate: dto.willingToRelocate ?? existing?.willingToRelocate ?? false,
      openToAbroad: dto.openToAbroad ?? existing?.openToAbroad ?? false,
      requiresVerifiedProfile:
        dto.requiresVerifiedProfile ?? existing?.requiresVerifiedProfile ?? false,
      minProfileCompleteness: dto.minProfileCompleteness ?? existing?.minProfileCompleteness ?? 0,
      isActive: dto.isActive ?? existing?.isActive ?? true,
      customExpectations: (dto.customExpectations ??
        existing?.customExpectations ??
        {}) as Prisma.InputJsonValue,
    };
  }

  private toDecimal(value: number | null): Prisma.Decimal | null {
    if (value == null) {
      return null;
    }
    return new Prisma.Decimal(value);
  }

  private toResponse(record: PartnerPreference): PartnerPreferenceResponseDto {
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
      preferredDistricts: record.preferredDistricts,
      preferredCountries: record.preferredCountries,
      preferredReligions: record.preferredReligions,
      preferredDenominations: record.preferredDenominations,
      preferredCommunities: record.preferredCommunities,
      preferredMotherTongues: record.preferredMotherTongues,
      employmentTypes: record.employmentTypes,
      willingToRelocate: record.willingToRelocate,
      openToAbroad: record.openToAbroad,
      requiresVerifiedProfile: record.requiresVerifiedProfile,
      minProfileCompleteness: record.minProfileCompleteness,
      isActive: record.isActive,
      customExpectations: record.customExpectations as Record<string, unknown>,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
