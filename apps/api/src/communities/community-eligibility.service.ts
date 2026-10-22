import { Injectable } from '@nestjs/common';
import { Community, CommunityMemberStatus, UserStatus } from '@soulsync/db';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { ageFromDateOfBirth } from './community-age.util';

export type CommunityEligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

@Injectable()
export class CommunityEligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldEncryptionService,
  ) {}

  async evaluate(community: Community, userId: string): Promise<CommunityEligibilityResult> {
    const reasons: string[] = [];

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      reasons.push('Account is not active');
      return { eligible: false, reasons };
    }

    if (user.tenantId !== community.tenantId) {
      reasons.push('Community belongs to a different tenant');
      return { eligible: false, reasons };
    }

    if (!user.username?.trim()) {
      reasons.push('Set a username in account settings before joining communities');
    }

    const blocked = await this.prisma.client.communityMember.findFirst({
      where: {
        communityId: community.id,
        userId,
        status: CommunityMemberStatus.BLOCKED,
      },
      select: { id: true },
    });
    if (blocked) {
      reasons.push('You are blocked from this community');
      return { eligible: false, reasons };
    }

    const profile = user.profile;
    if (!profile) {
      reasons.push('Complete your profile before joining');
      return { eligible: false, reasons };
    }

    if (community.allowedReligions.length > 0) {
      if (!profile.religion || !community.allowedReligions.includes(profile.religion)) {
        reasons.push('Your religion does not match this community’s eligibility rules');
      }
    }

    if (community.allowedCountries.length > 0) {
      const country = this.crypto.decryptString(profile.country) ?? profile.country ?? '';
      const normalized = country.trim().toUpperCase();
      const allowed = community.allowedCountries.map((c) => c.trim().toUpperCase());
      if (!normalized || !allowed.includes(normalized)) {
        reasons.push('Your country does not match this community’s eligibility rules');
      }
    }

    if (community.minAge != null || community.maxAge != null) {
      const age = ageFromDateOfBirth(profile.dateOfBirth);
      if (community.minAge != null && age < community.minAge) {
        reasons.push(`Minimum age is ${community.minAge}`);
      }
      if (community.maxAge != null && age > community.maxAge) {
        reasons.push(`Maximum age is ${community.maxAge}`);
      }
    }

    return { eligible: reasons.length === 0, reasons };
  }
}
