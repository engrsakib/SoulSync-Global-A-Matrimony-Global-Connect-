import { Injectable, NotFoundException } from '@nestjs/common';
import { ProposalStatus } from '@soulsync/db';
import {
  assertCompatibilityEligibility,
  buildEligibleCompatibilityDto,
  buildIneligibleCompatibilityDto,
  scoreCompatibility,
  type ProfileCompatibilityDto,
} from '@soulsync/shared-types/compatibility';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';
import { CompatibilitySnapshotLoader } from './compatibility-snapshot.loader';

const CACHE_TTL_SECONDS = 30 * 60;
const CACHE_PREFIX = 'compat:v1';

@Injectable()
export class CompatibilityService {
  constructor(
    private readonly loader: CompatibilitySnapshotLoader,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(
    tenantId: string,
    viewerUserId: string,
    targetUserId: string,
    viewerVersion: string,
    targetVersion: string,
  ): string {
    const [low, high] =
      viewerUserId < targetUserId ? [viewerUserId, targetUserId] : [targetUserId, viewerUserId];
    const [vLow, vHigh] =
      viewerUserId < targetUserId ? [viewerVersion, targetVersion] : [targetVersion, viewerVersion];
    return `${CACHE_PREFIX}:${tenantId}:${low}:${high}:${vLow}:${vHigh}`;
  }

  private async readCache(key: string): Promise<ProfileCompatibilityDto | null> {
    try {
      if (this.redis.client.status === 'wait') {
        await this.redis.client.connect();
      }
      const raw = await this.redis.client.get(key);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as ProfileCompatibilityDto;
    } catch {
      return null;
    }
  }

  private async writeCache(key: string, dto: ProfileCompatibilityDto): Promise<void> {
    try {
      if (this.redis.client.status === 'wait') {
        await this.redis.client.connect();
      }
      await this.redis.client.setex(key, CACHE_TTL_SECONDS, JSON.stringify(dto));
    } catch {
      // degrade gracefully
    }
  }

  private async hasAcceptedProposal(viewerUserId: string, targetUserId: string): Promise<boolean> {
    const row = await this.prisma.client.proposal.findFirst({
      where: {
        status: ProposalStatus.ACCEPTED,
        OR: [
          { senderId: viewerUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: viewerUserId },
        ],
      },
      select: { id: true },
    });
    return row != null;
  }

  async getCompatibility(
    viewerUserId: string,
    targetUserId: string,
  ): Promise<ProfileCompatibilityDto> {
    const viewerMeta = await this.prisma.client.user.findUnique({
      where: { id: viewerUserId },
      select: { id: true, tenantId: true, deletedAt: true },
    });
    if (!viewerMeta || viewerMeta.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const viewer = await this.loader.loadParticipant(viewerUserId, viewerMeta.tenantId);
    const target = await this.loader.loadParticipant(targetUserId, viewerMeta.tenantId);

    const cacheKey = this.cacheKey(
      viewerMeta.tenantId,
      viewerUserId,
      targetUserId,
      viewer.matchingVersion,
      target.matchingVersion,
    );
    const cached = await this.readCache(cacheKey);
    if (cached) {
      return cached;
    }

    const accepted = await this.hasAcceptedProposal(viewerUserId, targetUserId);

    const eligibility = assertCompatibilityEligibility(viewer, target, {
      viewerUserId,
      targetUserId,
      bypassDiscoverability: accepted,
      bypassDiscoveryReligion: accepted,
    });

    const dto = eligibility.eligible
      ? buildEligibleCompatibilityDto(targetUserId, scoreCompatibility(viewer, target))
      : buildIneligibleCompatibilityDto(targetUserId, eligibility.reason);

    await this.writeCache(cacheKey, dto);
    return dto;
  }

  async getCompatibilityByUsername(
    viewerUserId: string,
    username: string,
  ): Promise<ProfileCompatibilityDto> {
    const viewerMeta = await this.prisma.client.user.findUnique({
      where: { id: viewerUserId },
      select: { tenantId: true, deletedAt: true },
    });
    if (!viewerMeta || viewerMeta.deletedAt) {
      throw new NotFoundException('User not found');
    }
    const targetUserId = await this.loader.resolveUserIdByUsername(username, viewerMeta.tenantId);
    return this.getCompatibility(viewerUserId, targetUserId);
  }
}
