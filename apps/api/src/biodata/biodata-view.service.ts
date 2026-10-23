import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BiodataAccessRequestStatus, type Profile, type Religion } from '@soulsync/db';
import type { BiodataAccessRequestStatus as SharedAccessStatus } from '@soulsync/shared-types/biodata-visibility';
import {
  effectiveAccessRequestStatus,
  LOCKED_DIRECT_BIODATA_SECTION_IDS,
  LOCKED_REQUEST_BIODATA_SECTION_IDS,
  resolveVisibilityPolicy,
  SHAREABLE_BIODATA_SECTION_IDS,
  SHAREABLE_BIODATA_SECTION_TITLES,
} from '@soulsync/shared-types/biodata-visibility';
import {
  shouldShowOwnerAvatarToViewer,
  viewerMatchesDiscoveryReligionAudience,
} from '@soulsync/shared-types/biodata-discovery-settings';
import {
  buildBiodataLinkPreviewFromMemberView,
  buildRestrictedBiodataLinkPreview,
  type BiodataSectionViewerAccess,
  type MemberBiodataLinkPreviewDto,
  type MemberBiodataViewDto,
  type MemberBiodataViewSectionDto,
} from '@soulsync/shared-types/biodata-view';
import { PrismaService } from '../prisma/prisma.service';
import { BiodataService } from './biodata.service';
import { buildSectionViewContent } from './biodata-section-view-content';
import { MarriageConfirmationService } from '../marriage-confirmation/marriage-confirmation.service';
import { MarriageRecordService } from '../marriage-record/marriage-record.service';

@Injectable()
export class BiodataViewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly biodataService: BiodataService,
    private readonly marriageConfirmations: MarriageConfirmationService,
    private readonly marriageRecords: MarriageRecordService,
  ) {}

  async getMemberView(viewerUserId: string, username: string): Promise<MemberBiodataViewDto> {
    const normalizedUsername = username.trim().toLowerCase();
    const viewer = await this.loadViewer(viewerUserId);

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

    this.assertViewerMayOpenOwnerBiodata(viewer, owner.profile, owner.id);

    return this.buildMemberViewDto(viewerUserId, {
      id: owner.id,
      username: owner.username,
      avatarUrl: owner.avatarUrl,
      profile: owner.profile,
    });
  }

  async getMemberViewForTargetUserId(
    viewerUserId: string,
    targetUserId: string,
  ): Promise<MemberBiodataViewDto> {
    const viewer = await this.loadViewer(viewerUserId);

    const owner = await this.prisma.client.user.findFirst({
      where: {
        id: targetUserId,
        tenantId: viewer.tenantId,
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

    this.assertViewerMayOpenOwnerBiodata(viewer, owner.profile, owner.id);

    return this.buildMemberViewDto(viewerUserId, {
      id: owner.id,
      username: owner.username,
      avatarUrl: owner.avatarUrl,
      profile: owner.profile,
    });
  }

  private async loadViewer(viewerUserId: string) {
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
    return viewer;
  }

  private assertViewerMayOpenOwnerBiodata(
    viewer: { id: string; profile: { religion: Religion | null } | null },
    ownerProfile: Profile,
    ownerUserId: string,
  ) {
    if (viewer.id === ownerUserId) {
      return;
    }
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

  private async buildMemberViewDto(
    viewerUserId: string,
    owner: {
      id: string;
      username: string;
      avatarUrl: string | null;
      profile: Profile;
    },
  ): Promise<MemberBiodataViewDto> {
    const ownerProfile = owner.profile;
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

    const [confirmedMarriages, familySummary, confirmMarriagePanel] = await Promise.all([
      this.marriageConfirmations.listConfirmedForUser(owner.id),
      this.marriageRecords.buildPublicFamilySummary(owner.id),
      this.marriageRecords.buildPublicConfirmMarriagePanel(
        owner.id,
        biodata.profile.displayName,
      ),
    ]);

    const sections: MemberBiodataViewSectionDto[] = [];

    for (const sectionId of SHAREABLE_BIODATA_SECTION_IDS) {
      const title = SHAREABLE_BIODATA_SECTION_TITLES[sectionId];

      if (sectionId === 'islam_sharia' && ownerProfile.religion !== 'ISLAM') {
        sections.push({ sectionId, title, access: 'not_applicable' });
        continue;
      }

      const mode = (LOCKED_REQUEST_BIODATA_SECTION_IDS as readonly string[]).includes(sectionId)
        ? 'REQUEST'
        : (modeBySection.get(sectionId) ?? 'REQUEST');
      const isDirect =
        (LOCKED_DIRECT_BIODATA_SECTION_IDS as readonly string[]).includes(sectionId) ||
        (!(LOCKED_REQUEST_BIODATA_SECTION_IDS as readonly string[]).includes(sectionId) &&
          mode === 'DIRECT');

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
      confirmedMarriages,
      familySummary,
      confirmMarriagePanel,
      sections,
    };
  }

  async getLinkPreview(
    viewerUserId: string,
    username: string,
  ): Promise<MemberBiodataLinkPreviewDto> {
    const normalizedUsername = username.trim().toLowerCase();
    try {
      const view = await this.getMemberView(viewerUserId, normalizedUsername);
      return buildBiodataLinkPreviewFromMemberView(view);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return buildRestrictedBiodataLinkPreview(
          normalizedUsername,
          error.message || 'Member not found',
        );
      }
      if (error instanceof ForbiddenException) {
        return buildRestrictedBiodataLinkPreview(
          normalizedUsername,
          error.message ||
            'This member limits who can view their biodata based on religion settings.',
        );
      }
      throw error;
    }
  }
}

function mapRequestStatusToAccess(status: SharedAccessStatus | null): BiodataSectionViewerAccess {
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
