import { Injectable, NotFoundException } from '@nestjs/common';
import type { BiodataProfileDto } from '@soulsync/shared-types/biodata';
import type {
  CompatibilityParticipantSnapshot,
  CompatibilityProfileSlice,
} from '@soulsync/shared-types/compatibility';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  decryptMyPreferenceToDto,
  decryptPartnerPreferenceToDto,
  decryptProfileToDto,
} from '../biodata/biodata.mapper';

function toProfileSlice(dto: BiodataProfileDto): CompatibilityProfileSlice {
  return {
    gender: dto.gender,
    dateOfBirth: dto.dateOfBirth,
    heightCm: dto.heightCm,
    maritalStatus: dto.maritalStatus,
    country: dto.country,
    stateRegion: dto.stateRegion,
    city: dto.city,
    religion: dto.religion,
    denomination: dto.denomination,
    community: dto.community,
    motherTongue: dto.motherTongue,
    degreeName: dto.degreeName,
    occupation: dto.occupation,
    bio: dto.bio,
    entertainmentHabits: dto.entertainmentHabits,
    favoriteIslamicBooks: dto.favoriteIslamicBooks,
    favoriteScholars: dto.favoriteScholars,
    completenessScore: dto.completenessScore,
    isDiscoverable: dto.isDiscoverable,
    discoveryReligionMode: dto.discoveryReligionMode,
    discoveryReligionAllowList: dto.discoveryReligionAllowList,
  };
}

function matchingVersionFromDates(dates: Date[]): string {
  if (dates.length === 0) {
    return new Date(0).toISOString();
  }
  const max = Math.max(...dates.map((d) => d.getTime()));
  return new Date(max).toISOString();
}

@Injectable()
export class CompatibilitySnapshotLoader {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldEncryptionService,
  ) {}

  async loadParticipant(
    userId: string,
    tenantId: string,
  ): Promise<CompatibilityParticipantSnapshot> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      include: {
        profile: true,
        partnerPreference: true,
        myPreference: true,
      },
    });

    if (!user?.profile) {
      throw new NotFoundException('User or profile not found');
    }

    const profileDto = decryptProfileToDto(this.crypto, user.profile);
    const partnerPreference = user.partnerPreference
      ? decryptPartnerPreferenceToDto(this.crypto, user.partnerPreference)
      : null;
    const myPreference = user.myPreference
      ? decryptMyPreferenceToDto(this.crypto, user.myPreference)
      : null;

    const versionDates = [user.profile.updatedAt];
    if (user.partnerPreference) {
      versionDates.push(user.partnerPreference.updatedAt);
    }
    if (user.myPreference) {
      versionDates.push(user.myPreference.updatedAt);
    }

    return {
      userId: user.id,
      tenantId: user.tenantId,
      username: user.username,
      deletedAt: user.deletedAt?.toISOString() ?? null,
      profile: toProfileSlice(profileDto),
      partnerPreference,
      myPreference,
      matchingVersion: matchingVersionFromDates(versionDates),
    };
  }

  async resolveUserIdByUsername(username: string, tenantId: string): Promise<string> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        tenantId,
        username: username.trim().toLowerCase(),
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('Member not found');
    }
    return user.id;
  }
}
