import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Community,
  CommunityMember,
  CommunityMemberRole,
  CommunityMemberStatus,
  UserStatus,
} from '@soulsync/db';
import { canModerateCommunity, isCommunityAdminRole } from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireTenantUser(userId: string): Promise<{
    id: string;
    tenantId: string;
    username: string | null;
  }> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, username: true, status: true, deletedAt: true },
    });
    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User is not active');
    }
    return user;
  }

  async findCommunityBySlug(tenantId: string, slug: string): Promise<Community> {
    const community = await this.prisma.client.community.findFirst({
      where: { tenantId, slug, deletedAt: null },
    });
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  async getMembership(communityId: string, userId: string): Promise<CommunityMember | null> {
    return this.prisma.client.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
  }

  assertActiveMember(
    membership: CommunityMember | null,
    message = 'You must be an active member of this community',
  ): CommunityMember {
    if (!membership || membership.status !== CommunityMemberStatus.ACTIVE) {
      throw new ForbiddenException(message);
    }
    return membership;
  }

  assertCanModerate(membership: CommunityMember): void {
    if (!canModerateCommunity(membership.role)) {
      throw new ForbiddenException('Moderator access required');
    }
  }

  assertCanAdminister(membership: CommunityMember): void {
    if (!isCommunityAdminRole(membership.role)) {
      throw new ForbiddenException('Admin access required');
    }
  }

  assertOwner(membership: CommunityMember): void {
    if (membership.role !== CommunityMemberRole.OWNER) {
      throw new ForbiddenException('Owner access required');
    }
  }
}
