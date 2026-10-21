import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  CommunityJoinRequestStatus,
  CommunityMemberRole,
  CommunityMemberStatus,
  CommunityPrivacy,
} from '@soulsync/db';
import type {
  CommunityDto,
  CommunityJoinRequestDto,
  CreateCommunityJoinRequestDto,
  DecideCommunityJoinRequestDto,
} from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { CommunityEligibilityService } from './community-eligibility.service';
import { toCommunityDto, toJoinRequestDto } from './community.mapper';

@Injectable()
export class CommunityJoinRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
    private readonly eligibility: CommunityEligibilityService,
  ) {}

  async join(
    userId: string,
    slug: string,
    body: CreateCommunityJoinRequestDto = {},
  ): Promise<CommunityDto | CommunityJoinRequestDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);

    const existingMember = await this.access.getMembership(community.id, userId);
    if (existingMember?.status === CommunityMemberStatus.ACTIVE) {
      throw new ConflictException('Already a member');
    }
    if (existingMember?.status === CommunityMemberStatus.BLOCKED) {
      throw new ForbiddenException('You are blocked from this community');
    }

    const { eligible, reasons } = await this.eligibility.evaluate(community, userId);
    if (!eligible) {
      throw new ForbiddenException(reasons.join('; ') || 'Not eligible to join');
    }

    if (community.privacy === CommunityPrivacy.PUBLIC) {
      const member = await this.prisma.client.communityMember.upsert({
        where: { communityId_userId: { communityId: community.id, userId } },
        create: {
          communityId: community.id,
          userId,
          tenantId: user.tenantId,
          role: CommunityMemberRole.MEMBER,
          status: CommunityMemberStatus.ACTIVE,
        },
        update: {
          status: CommunityMemberStatus.ACTIVE,
          role: CommunityMemberRole.MEMBER,
          blockedAt: null,
          removedAt: null,
          removedByUserId: null,
        },
      });
      return toCommunityDto(community, member);
    }

    const pending = await this.prisma.client.communityJoinRequest.findFirst({
      where: {
        communityId: community.id,
        userId,
        status: CommunityJoinRequestStatus.PENDING,
      },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    if (pending) {
      return toJoinRequestDto(pending);
    }

    const created = await this.prisma.client.communityJoinRequest.create({
      data: {
        communityId: community.id,
        userId,
        tenantId: user.tenantId,
        message: body.message?.trim() || null,
      },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return toJoinRequestDto(created);
  }

  async listPending(userId: string, slug: string): Promise<CommunityJoinRequestDto[]> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );
    this.access.assertCanModerate(membership);

    const rows = await this.prisma.client.communityJoinRequest.findMany({
      where: { communityId: community.id, status: CommunityJoinRequestStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return rows.map(toJoinRequestDto);
  }

  async decide(
    userId: string,
    slug: string,
    requestId: string,
    body: DecideCommunityJoinRequestDto,
  ): Promise<CommunityJoinRequestDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );
    this.access.assertCanModerate(membership);

    const joinRequest = await this.prisma.client.communityJoinRequest.findFirst({
      where: { id: requestId, communityId: community.id },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    if (!joinRequest) {
      throw new BadRequestException('Join request not found');
    }
    if (joinRequest.status !== CommunityJoinRequestStatus.PENDING) {
      throw new BadRequestException('Join request is already decided');
    }

    const now = new Date();
    if (body.decision === 'deny') {
      const updated = await this.prisma.client.communityJoinRequest.update({
        where: { id: joinRequest.id },
        data: {
          status: CommunityJoinRequestStatus.DENIED,
          decidedByUserId: userId,
          decidedAt: now,
        },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      });
      return toJoinRequestDto(updated);
    }

    const updated = await this.prisma.client.$transaction(async (tx) => {
      await tx.communityMember.upsert({
        where: {
          communityId_userId: { communityId: community.id, userId: joinRequest.userId },
        },
        create: {
          communityId: community.id,
          userId: joinRequest.userId,
          tenantId: community.tenantId,
          role: CommunityMemberRole.MEMBER,
          status: CommunityMemberStatus.ACTIVE,
        },
        update: {
          status: CommunityMemberStatus.ACTIVE,
          role: CommunityMemberRole.MEMBER,
          blockedAt: null,
          removedAt: null,
          removedByUserId: null,
        },
      });

      return tx.communityJoinRequest.update({
        where: { id: joinRequest.id },
        data: {
          status: CommunityJoinRequestStatus.APPROVED,
          decidedByUserId: userId,
          decidedAt: now,
        },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      });
    });

    return toJoinRequestDto(updated);
  }
}
