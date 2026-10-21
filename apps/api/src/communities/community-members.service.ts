import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommunityMemberRole, CommunityMemberStatus } from '@soulsync/db';
import type {
  CommunityMemberDto,
  CommunityMemberPostsDto,
  PatchCommunityMemberDto,
} from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { toMemberDto } from './community.mapper';
import { CommunityPostsService } from './community-posts.service';

const MEMBER_SEARCH_LIMIT = 20;
const DEFAULT_POST_LIMIT = 20;

@Injectable()
export class CommunityMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
    private readonly postsService: CommunityPostsService,
  ) {}

  async listMembers(userId: string, slug: string): Promise<CommunityMemberDto[]> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    this.access.assertActiveMember(await this.access.getMembership(community.id, userId));

    const rows = await this.prisma.client.communityMember.findMany({
      where: { communityId: community.id, status: CommunityMemberStatus.ACTIVE },
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return rows.map(toMemberDto);
  }

  async patchMember(
    actorUserId: string,
    slug: string,
    targetUserId: string,
    body: PatchCommunityMemberDto,
  ): Promise<CommunityMemberDto> {
    const user = await this.access.requireTenantUser(actorUserId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const actor = this.access.assertActiveMember(
      await this.access.getMembership(community.id, actorUserId),
    );
    this.access.assertCanAdminister(actor);

    const target = await this.prisma.client.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    if (!target) {
      throw new NotFoundException('Member not found');
    }
    if (target.role === CommunityMemberRole.OWNER) {
      throw new ForbiddenException('Cannot change the owner role');
    }

    if (body.role === CommunityMemberRole.OWNER) {
      throw new BadRequestException('Use ownership transfer to assign owner');
    }

    const updated = await this.prisma.client.communityMember.update({
      where: { id: target.id },
      data: {
        role: body.role,
        isTrustedPoster: body.isTrustedPoster,
      },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return toMemberDto(updated);
  }

  async blockMember(actorUserId: string, slug: string, targetUserId: string): Promise<CommunityMemberDto> {
    return this.setMemberStatus(actorUserId, slug, targetUserId, CommunityMemberStatus.BLOCKED, {
      blockedAt: new Date(),
    });
  }

  async removeMember(actorUserId: string, slug: string, targetUserId: string): Promise<CommunityMemberDto> {
    return this.setMemberStatus(actorUserId, slug, targetUserId, CommunityMemberStatus.REMOVED, {
      removedAt: new Date(),
      removedByUserId: actorUserId,
    });
  }

  private async setMemberStatus(
    actorUserId: string,
    slug: string,
    targetUserId: string,
    status: CommunityMemberStatus,
    extra: { blockedAt?: Date; removedAt?: Date; removedByUserId?: string },
  ): Promise<CommunityMemberDto> {
    const user = await this.access.requireTenantUser(actorUserId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const actor = this.access.assertActiveMember(
      await this.access.getMembership(community.id, actorUserId),
    );
    this.access.assertCanModerate(actor);

    const target = await this.prisma.client.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: targetUserId } },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    if (!target) {
      throw new NotFoundException('Member not found');
    }
    if (target.role === CommunityMemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove or block the owner');
    }

    const updated = await this.prisma.client.communityMember.update({
      where: { id: target.id },
      data: { status, ...extra },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return toMemberDto(updated);
  }

  async searchByUsername(
    userId: string,
    slug: string,
    query: string,
  ): Promise<CommunityMemberDto[]> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    this.access.assertActiveMember(await this.access.getMembership(community.id, userId));

    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }

    const rows = await this.prisma.client.communityMember.findMany({
      where: {
        communityId: community.id,
        status: CommunityMemberStatus.ACTIVE,
        user: {
          username: { startsWith: q, mode: 'insensitive' },
        },
      },
      take: MEMBER_SEARCH_LIMIT,
      orderBy: { joinedAt: 'asc' },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    return rows.map(toMemberDto);
  }

  async getMemberCard(
    userId: string,
    slug: string,
    username: string,
  ): Promise<CommunityMemberDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    this.access.assertActiveMember(await this.access.getMembership(community.id, userId));

    const member = await this.prisma.client.communityMember.findFirst({
      where: {
        communityId: community.id,
        status: CommunityMemberStatus.ACTIVE,
        user: { username: { equals: username, mode: 'insensitive' } },
      },
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }
    return toMemberDto(member);
  }

  async listMemberPosts(
    userId: string,
    slug: string,
    username: string,
    cursor?: string,
  ): Promise<CommunityMemberPostsDto> {
    const member = await this.getMemberCard(userId, slug, username);
    const feed = await this.postsService.listFeed(userId, slug, {
      cursor,
      limit: DEFAULT_POST_LIMIT,
      authorUserId: member.userId,
      publishedOnly: true,
    });
    return { member, feed };
  }
}
