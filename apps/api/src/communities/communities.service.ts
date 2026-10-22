import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CommunityJoinRequestStatus,
  CommunityMemberRole,
  CommunityMemberStatus,
  CommunityPrivacy,
  Religion,
} from '@soulsync/db';
import type {
  CommunityDto,
  CreateCommunityDto,
  PatchCommunityDto,
} from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityAccessService } from './community-access.service';
import { CommunitySlugService } from './community-slug.service';
import { loadCommunityMemberStats } from './community-member-stats';
import { loadCommunityPostStats, loadCommunityPostStatsBatch } from './community-post-stats';
import { toCommunityDto } from './community.mapper';

@Injectable()
export class CommunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: CommunityAccessService,
    private readonly slugService: CommunitySlugService,
  ) {}

  async listForUser(userId: string): Promise<CommunityDto[]> {
    const user = await this.access.requireTenantUser(userId);
    const rows = await this.prisma.client.community.findMany({
      where: { tenantId: user.tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            members: { where: { status: CommunityMemberStatus.ACTIVE } },
          },
        },
      },
    });

    const communityIds = rows.map((r) => r.id);
    const memberships = await this.prisma.client.communityMember.findMany({
      where: { userId, communityId: { in: communityIds } },
    });
    const byCommunity = new Map(memberships.map((m) => [m.communityId, m]));

    const pendingJoins = await this.prisma.client.communityJoinRequest.findMany({
      where: {
        userId,
        communityId: { in: communityIds },
        status: CommunityJoinRequestStatus.PENDING,
      },
      select: { communityId: true },
    });
    const pendingJoinSet = new Set(pendingJoins.map((row) => row.communityId));

    const postStatsById = await loadCommunityPostStatsBatch(
      this.prisma.client,
      rows.map((row) => ({ id: row.id, createdAt: row.createdAt })),
    );

    return rows.map((row) =>
      toCommunityDto(row, byCommunity.get(row.id) ?? null, {
        activeMemberCount: row._count.members,
        memberAvatarPreview: [],
        viewerPendingJoinRequest: pendingJoinSet.has(row.id),
        ...postStatsById.get(row.id),
      }),
    );
  }

  async getDetail(userId: string, slug: string): Promise<CommunityDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = await this.access.getMembership(community.id, userId);
    const [stats, postStats] = await Promise.all([
      loadCommunityMemberStats(this.prisma.client, community.id),
      loadCommunityPostStats(this.prisma.client, community.id, community.createdAt),
    ]);
    const pendingJoin = await this.prisma.client.communityJoinRequest.findFirst({
      where: {
        communityId: community.id,
        userId,
        status: CommunityJoinRequestStatus.PENDING,
      },
      select: { id: true },
    });
    return toCommunityDto(community, membership, {
      ...stats,
      ...postStats,
      viewerPendingJoinRequest: pendingJoin != null,
    });
  }

  async create(userId: string, body: CreateCommunityDto): Promise<CommunityDto> {
    const user = await this.access.requireTenantUser(userId);
    const name = body.name?.trim();
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    this.validateTargeting(body);

    const slug = await this.slugService.allocateUniqueSlug(user.tenantId, name);

    const community = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.community.create({
        data: {
          tenantId: user.tenantId,
          createdByUserId: userId,
          name,
          slug,
          description: body.description?.trim() || null,
          coverImageUrl: body.coverImageUrl ?? null,
          coverImagePublicId: body.coverImagePublicId ?? null,
          allowedReligions: (body.allowedReligions ?? []) as Religion[],
          allowedCountries: body.allowedCountries ?? [],
          minAge: body.minAge ?? null,
          maxAge: body.maxAge ?? null,
          privacy: body.privacy ?? CommunityPrivacy.PUBLIC,
          postApprovalMode: body.postApprovalMode ?? undefined,
        },
      });

      await tx.communityMember.create({
        data: {
          communityId: created.id,
          userId,
          tenantId: user.tenantId,
          role: CommunityMemberRole.OWNER,
          status: CommunityMemberStatus.ACTIVE,
        },
      });

      return created;
    });

    const membership = await this.access.getMembership(community.id, userId);
    const [stats, postStats] = await Promise.all([
      loadCommunityMemberStats(this.prisma.client, community.id),
      loadCommunityPostStats(this.prisma.client, community.id, community.createdAt),
    ]);
    return toCommunityDto(community, membership, { ...stats, ...postStats });
  }

  async patch(userId: string, slug: string, body: PatchCommunityDto): Promise<CommunityDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );
    this.access.assertCanAdminister(membership);

    this.validateTargeting(body);

    const updated = await this.prisma.client.community.update({
      where: { id: community.id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        description: body.description !== undefined ? body.description?.trim() || null : undefined,
        coverImageUrl: body.coverImageUrl,
        coverImagePublicId: body.coverImagePublicId,
        allowedReligions:
          body.allowedReligions !== undefined ? (body.allowedReligions as Religion[]) : undefined,
        allowedCountries: body.allowedCountries,
        minAge: body.minAge,
        maxAge: body.maxAge,
        privacy: body.privacy,
        postApprovalMode: body.postApprovalMode,
      },
    });

    const [stats, postStats] = await Promise.all([
      loadCommunityMemberStats(this.prisma.client, updated.id),
      loadCommunityPostStats(this.prisma.client, updated.id, updated.createdAt),
    ]);
    return toCommunityDto(updated, membership, { ...stats, ...postStats });
  }

  async softDelete(userId: string, slug: string): Promise<CommunityDto> {
    const user = await this.access.requireTenantUser(userId);
    const community = await this.access.findCommunityBySlug(user.tenantId, slug);
    const membership = this.access.assertActiveMember(
      await this.access.getMembership(community.id, userId),
    );
    this.access.assertOwner(membership);

    const updated = await this.prisma.client.community.update({
      where: { id: community.id },
      data: { deletedAt: new Date() },
    });

    const [stats, postStats] = await Promise.all([
      loadCommunityMemberStats(this.prisma.client, updated.id),
      loadCommunityPostStats(this.prisma.client, updated.id, updated.createdAt),
    ]);
    return toCommunityDto(updated, membership, { ...stats, ...postStats });
  }

  private validateTargeting(body: CreateCommunityDto | PatchCommunityDto): void {
    if (body.minAge != null && body.maxAge != null && body.minAge > body.maxAge) {
      throw new BadRequestException('minAge cannot exceed maxAge');
    }
    if (body.allowedCountries) {
      for (const code of body.allowedCountries) {
        if (!/^[A-Za-z]{2}$/.test(code)) {
          throw new BadRequestException(`Invalid country code: ${code}`);
        }
      }
    }
  }
}
