import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BiodataAccessRequestStatus } from '@soulsync/db';
import type { BiodataAccessRequestStatus as SharedAccessStatus } from '@soulsync/shared-types/biodata-visibility';
import {
  effectiveAccessRequestStatus,
  LOCKED_DIRECT_BIODATA_SECTION_IDS,
  resolveVisibilityPolicy,
  SHAREABLE_BIODATA_SECTION_IDS,
  SHAREABLE_BIODATA_SECTION_TITLES,
} from '@soulsync/shared-types/biodata-visibility';
import {
  shouldShowOwnerAvatarToViewer,
  viewerMatchesDiscoveryReligionAudience,
} from '@soulsync/shared-types/biodata-discovery-settings';
import type {
  BiodataSectionViewerAccess,
  MemberBiodataViewDto,
  MemberBiodataViewSectionDto,
} from '@soulsync/shared-types/biodata-view';
import { PrismaService } from '../prisma/prisma.service';
import { BiodataService } from './biodata.service';
import { buildSectionViewContent } from './biodata-section-view-content';

@Injectable()
export class BiodataViewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly biodataService: BiodataService,
  ) {}

  async getMemberView(viewerUserId: string, username: string): Promise<MemberBiodataViewDto> {
    const normalizedUsername = username.trim().toLowerCase();

    const viewer = await this.prisma.client.user.findUnique({
      where: { id: viewerUserId },
      select: {
        id: true,
        tenantId: true,
        deletedAt: true,
        profile: { select: { religion: true } },
      },
    });
    if (!viewer || viewer.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const owner = await this.prisma.client.user.findFirst({
      where: {
        tenantId: viewer.tenantId,
        username: normalizedUsername,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        profile: true,
      },
    });

    if (!owner?.profile || !owner.username) {
      throw new NotFoundException('Member not found');
    }

    const ownerProfile = owner.profile;

    if (viewerUserId !== owner.id) {
      const viewerReligion = viewer.profile?.religion ?? null;
      const allowed = viewerMatchesDiscoveryReligionAudience(viewerReligion, {
        religion: ownerProfile.religion,
        discoveryReligionMode: ownerProfile.discoveryReligionMode,
        discoveryReligionAllowList: ownerProfile.discoveryReligionAllowList,
      });
      if (!allowed) {
        throw new ForbiddenException(
          'This member limits who can view their biodata based on religion settings.',
        );
      }
    }

    const biodata = await this.biodataService.getMine(owner.id);

    const visibilityRows = await this.prisma.client.biodataSectionVisibility.findMany({
      where: { ownerUserId: owner.id },
      select: { sectionId: true, mode: true },
    });
    const policy = resolveVisibilityPolicy(visibilityRows);
    const modeBySection = new Map(policy.sections.map((row) => [row.sectionId, row.mode]));

    const accessRequests = await this.prisma.client.biodataAccessRequest.findMany({
      where: {
        ownerUserId: owner.id,
        requesterUserId: viewerUserId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const latestRequestBySection = new Map<string, (typeof accessRequests)[number]>();
    for (const row of accessRequests) {
      if (!latestRequestBySection.has(row.sectionId)) {
        latestRequestBySection.set(row.sectionId, row);
      }
    }

    const showAvatar = shouldShowOwnerAvatarToViewer(ownerProfile.photoVisibility, true);

    const sections: MemberBiodataViewSectionDto[] = [];

    for (const sectionId of SHAREABLE_BIODATA_SECTION_IDS) {
      const title = SHAREABLE_BIODATA_SECTION_TITLES[sectionId];

      if (sectionId === 'islam_sharia' && ownerProfile.religion !== 'ISLAM') {
        sections.push({ sectionId, title, access: 'not_applicable' });
        continue;
      }

      const mode = modeBySection.get(sectionId) ?? 'REQUEST';
      const isDirect =
        (LOCKED_DIRECT_BIODATA_SECTION_IDS as readonly string[]).includes(sectionId) ||
        mode === 'DIRECT';

      let access: BiodataSectionViewerAccess;
      let content: Record<string, unknown> | undefined;

      if (viewerUserId === owner.id || isDirect) {
        access = 'visible';
        content = buildSectionViewContent(sectionId, biodata);
      } else {
        const grant = latestRequestBySection.get(sectionId);
        const effectiveStatus: SharedAccessStatus | null = grant
          ? effectiveAccessRequestStatus(grant.status, grant.expiresAt)
          : null;

        if (effectiveStatus === 'APPROVED') {
          access = 'visible';
          content = buildSectionViewContent(sectionId, biodata);
        } else {
          access = mapRequestStatusToAccess(effectiveStatus);
        }
      }

      sections.push({ sectionId, title, access, content });
    }

    return {
      owner: {
        id: owner.id,
        username: owner.username,
        displayName: biodata.profile.displayName,
        avatarUrl: showAvatar ? owner.avatarUrl : null,
      },
      accessRequestOwnerUserId: owner.id,
      sections,
    };
  }
}

function mapRequestStatusToAccess(
  status: SharedAccessStatus | null,
): BiodataSectionViewerAccess {
  if (!status) {
    return 'locked';
  }
  switch (status) {
    case BiodataAccessRequestStatus.PENDING:
      return 'pending';
    case BiodataAccessRequestStatus.DENIED:
      return 'denied';
    case 'EXPIRED':
      return 'expired';
    case BiodataAccessRequestStatus.REVOKED:
      return 'locked';
    default:
      return 'locked';
  }
}
