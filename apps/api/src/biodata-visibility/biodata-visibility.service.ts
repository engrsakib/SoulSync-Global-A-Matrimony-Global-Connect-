import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BiodataAccessRequestStatus, BiodataSectionVisibilityMode, Prisma } from '@soulsync/db';
import type {
  BiodataAccessRequestDto,
  BiodataAccessRequestListDto,
  BiodataVisibilityPatchDto,
  BiodataVisibilityPolicyDto,
  CreateBiodataAccessRequestDto,
  DecideBiodataAccessRequestDto,
  ShareableBiodataSectionId,
} from '@soulsync/shared-types/biodata-visibility';
import {
  effectiveAccessRequestStatus,
  isShareableBiodataSectionId,
  LOCKED_DIRECT_BIODATA_SECTION_IDS,
  LOCKED_REQUEST_BIODATA_SECTION_IDS,
  resolveVisibilityPolicy,
  SHAREABLE_BIODATA_SECTION_TITLES,
} from '@soulsync/shared-types/biodata-visibility';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { resolveAccessRequestRequesterName } from './access-request-requester-name';
import { ActivityLogRecorder } from '../activity-log/activity-log.recorder';

@Injectable()
export class BiodataVisibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldEncryptionService,
    private readonly activityLog: ActivityLogRecorder,
  ) {}

  private readonly userActivitySelect = {
    id: true,
    tenantId: true,
    username: true,
    firstName: true,
    lastName: true,
    profile: { select: { displayName: true } },
  } as const;

  async getVisibilityPolicy(userId: string): Promise<BiodataVisibilityPolicyDto> {
    await this.ensureUser(userId);
    const rows = await this.prisma.client.biodataSectionVisibility.findMany({
      where: { ownerUserId: userId },
      select: { sectionId: true, mode: true },
    });
    return resolveVisibilityPolicy(
      rows.map((row) => ({
        sectionId: row.sectionId,
        mode: row.mode,
      })),
    );
  }

  async patchVisibilityPolicy(
    userId: string,
    patch: BiodataVisibilityPatchDto,
  ): Promise<BiodataVisibilityPolicyDto> {
    const user = await this.ensureUser(userId);

    const updatedSectionIds: string[] = [];

    for (const entry of patch.sections) {
      if (!isShareableBiodataSectionId(entry.sectionId)) {
        throw new BadRequestException(`Invalid section: ${String(entry.sectionId)}`);
      }
      if ((LOCKED_DIRECT_BIODATA_SECTION_IDS as readonly string[]).includes(entry.sectionId)) {
        if (entry.mode !== 'DIRECT') {
          throw new BadRequestException('Personal details must remain directly visible');
        }
        continue;
      }
      if ((LOCKED_REQUEST_BIODATA_SECTION_IDS as readonly string[]).includes(entry.sectionId)) {
        if (entry.mode !== 'REQUEST') {
          throw new BadRequestException('Photo gallery always requires permission to view');
        }
        continue;
      }
      if (entry.mode !== 'DIRECT' && entry.mode !== 'REQUEST') {
        throw new BadRequestException(`Invalid visibility mode for ${entry.sectionId}`);
      }

      await this.prisma.client.biodataSectionVisibility.upsert({
        where: {
          ownerUserId_sectionId: {
            ownerUserId: userId,
            sectionId: entry.sectionId,
          },
        },
        create: {
          tenantId: user.tenantId,
          ownerUserId: userId,
          sectionId: entry.sectionId,
          mode: entry.mode,
        },
        update: {
          mode: entry.mode,
        },
      });
      updatedSectionIds.push(entry.sectionId);
    }

    if (updatedSectionIds.length > 0) {
      const snippet = await this.prisma.client.user.findUnique({
        where: { id: userId },
        select: this.userActivitySelect,
      });
      if (snippet) {
        this.activityLog.biodataPrivacyUpdated(snippet, updatedSectionIds);
      }
    }

    return this.getVisibilityPolicy(userId);
  }

  async listAccessRequests(
    ownerUserId: string,
    options: { includeHistory?: boolean } = {},
  ): Promise<BiodataAccessRequestListDto> {
    await this.ensureUser(ownerUserId);
    const includeHistory = options.includeHistory ?? true;

    const pendingRows = await this.prisma.client.biodataAccessRequest.findMany({
      where: { ownerUserId, status: BiodataAccessRequestStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      include: { requester: { include: { profile: true } } },
    });

    const historyRows = includeHistory
      ? await this.prisma.client.biodataAccessRequest.findMany({
          where: {
            ownerUserId,
            status: { not: BiodataAccessRequestStatus.PENDING },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { requester: { include: { profile: true } } },
        })
      : [];

    return {
      pending: pendingRows.map((row) => this.toAccessRequestDto(row)),
      history: historyRows.map((row) => this.toAccessRequestDto(row)),
    };
  }

  async createAccessRequest(
    requesterUserId: string,
    body: CreateBiodataAccessRequestDto,
  ): Promise<BiodataAccessRequestDto> {
    if (body.ownerUserId === requesterUserId) {
      throw new BadRequestException('You cannot request access to your own biodata');
    }
    if (!isShareableBiodataSectionId(body.sectionId)) {
      throw new BadRequestException('Invalid section');
    }

    const [requester, owner] = await Promise.all([
      this.ensureUser(requesterUserId),
      this.ensureUser(body.ownerUserId),
    ]);

    if (requester.tenantId !== owner.tenantId) {
      throw forbidden('Cannot request access across tenants');
    }

    const mode = await this.resolveSectionMode(body.ownerUserId, body.sectionId);
    if (mode === 'DIRECT') {
      throw new BadRequestException('This section is already visible to members');
    }

    try {
      const created = await this.prisma.client.biodataAccessRequest.create({
        data: {
          tenantId: owner.tenantId,
          ownerUserId: body.ownerUserId,
          requesterUserId,
          sectionId: body.sectionId,
          message: body.message?.trim() || null,
          status: BiodataAccessRequestStatus.PENDING,
        },
        include: { requester: { include: { profile: true } } },
      });
      const dto = this.toAccessRequestDto(created);
      const [requesterSnippet, ownerSnippet] = await Promise.all([
        this.prisma.client.user.findUnique({
          where: { id: requesterUserId },
          select: this.userActivitySelect,
        }),
        this.prisma.client.user.findUnique({
          where: { id: body.ownerUserId },
          select: this.userActivitySelect,
        }),
      ]);
      if (requesterSnippet && ownerSnippet) {
        this.activityLog.accessRequestCreated(
          requesterSnippet,
          ownerSnippet,
          body.sectionId,
          dto.sectionTitle,
        );
      }
      return dto;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('A pending request already exists for this section');
      }
      throw error;
    }
  }

  async decideAccessRequest(
    ownerUserId: string,
    requestId: string,
    body: DecideBiodataAccessRequestDto,
  ): Promise<BiodataAccessRequestDto> {
    const request = await this.prisma.client.biodataAccessRequest.findUnique({
      where: { id: requestId },
      include: { requester: { include: { profile: true } } },
    });

    if (!request || request.ownerUserId !== ownerUserId) {
      throw new NotFoundException('Access request not found');
    }

    const now = new Date();

    if (body.decision === 'revoke') {
      if (request.status !== BiodataAccessRequestStatus.APPROVED) {
        throw new BadRequestException('Only approved grants can be revoked');
      }
      const updated = await this.prisma.client.biodataAccessRequest.update({
        where: { id: requestId },
        data: {
          status: BiodataAccessRequestStatus.REVOKED,
          decidedAt: now,
        },
        include: { requester: { include: { profile: true } } },
      });
      const dto = this.toAccessRequestDto(updated);
      await this.recordAccessRequestDecided(ownerUserId, request.requesterUserId, dto.sectionTitle, 'revoke');
      return dto;
    }

    if (request.status !== BiodataAccessRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been decided');
    }

    if (body.decision === 'deny') {
      const updated = await this.prisma.client.biodataAccessRequest.update({
        where: { id: requestId },
        data: {
          status: BiodataAccessRequestStatus.DENIED,
          decidedAt: now,
        },
        include: { requester: { include: { profile: true } } },
      });
      const dto = this.toAccessRequestDto(updated);
      await this.recordAccessRequestDecided(ownerUserId, request.requesterUserId, dto.sectionTitle, 'deny');
      return dto;
    }

    if (body.decision !== 'approve') {
      throw new BadRequestException('Invalid decision');
    }

    const audience = body.audience ?? 'requester';
    let expiresAt: Date | null = null;
    if (body.forever) {
      expiresAt = null;
    } else if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
        throw new BadRequestException('expiresAt must be a future date');
      }
    } else {
      throw new BadRequestException('Specify forever or expiresAt when approving');
    }

    const owner = await this.ensureUser(ownerUserId);

    const updated = await this.prisma.client.$transaction(async (tx) => {
      if (audience === 'everyone') {
        if (!isShareableBiodataSectionId(request.sectionId)) {
          throw new BadRequestException('Invalid section');
        }
        if ((LOCKED_REQUEST_BIODATA_SECTION_IDS as readonly string[]).includes(request.sectionId)) {
          throw new BadRequestException('Photo gallery always requires per-member permission');
        }
        await tx.biodataSectionVisibility.upsert({
          where: {
            ownerUserId_sectionId: {
              ownerUserId,
              sectionId: request.sectionId,
            },
          },
          create: {
            tenantId: owner.tenantId,
            ownerUserId,
            sectionId: request.sectionId,
            mode: BiodataSectionVisibilityMode.DIRECT,
          },
          update: {
            mode: BiodataSectionVisibilityMode.DIRECT,
          },
        });
      }

      return tx.biodataAccessRequest.update({
        where: { id: requestId },
        data: {
          status: BiodataAccessRequestStatus.APPROVED,
          decidedAt: now,
          expiresAt,
        },
        include: { requester: { include: { profile: true } } },
      });
    });

    const dto = this.toAccessRequestDto(updated);
    await this.recordAccessRequestDecided(ownerUserId, request.requesterUserId, dto.sectionTitle, 'approve');
    return dto;
  }

  private async recordAccessRequestDecided(
    ownerUserId: string,
    requesterUserId: string,
    sectionTitle: string,
    decision: 'approve' | 'deny' | 'revoke',
  ): Promise<void> {
    const [owner, requester] = await Promise.all([
      this.prisma.client.user.findUnique({
        where: { id: ownerUserId },
        select: this.userActivitySelect,
      }),
      this.prisma.client.user.findUnique({
        where: { id: requesterUserId },
        select: this.userActivitySelect,
      }),
    ]);
    if (owner && requester) {
      this.activityLog.accessRequestDecided({ requester, owner, sectionTitle, decision });
    }
  }

  private async resolveSectionMode(
    ownerUserId: string,
    sectionId: ShareableBiodataSectionId,
  ): Promise<'DIRECT' | 'REQUEST'> {
    if ((LOCKED_DIRECT_BIODATA_SECTION_IDS as readonly string[]).includes(sectionId)) {
      return 'DIRECT';
    }
    if ((LOCKED_REQUEST_BIODATA_SECTION_IDS as readonly string[]).includes(sectionId)) {
      return 'REQUEST';
    }
    const row = await this.prisma.client.biodataSectionVisibility.findUnique({
      where: {
        ownerUserId_sectionId: { ownerUserId, sectionId },
      },
    });
    if (!row) {
      return 'REQUEST';
    }
    return row.mode;
  }

  private async ensureUser(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, username: true, firstName: true, lastName: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private toAccessRequestDto(row: {
    id: string;
    sectionId: string;
    status: BiodataAccessRequestStatus;
    message: string | null;
    expiresAt: Date | null;
    decidedAt: Date | null;
    createdAt: Date;
    requester: {
      id: string;
      username: string | null;
      firstName: string | null;
      lastName: string | null;
      profile: { displayName: string } | null;
    };
  }): BiodataAccessRequestDto {
    if (!isShareableBiodataSectionId(row.sectionId)) {
      throw new Error(`Invalid section id on access request: ${row.sectionId}`);
    }
    const sectionId = row.sectionId;
    const status = effectiveAccessRequestStatus(row.status, row.expiresAt);
    const requesterName = resolveAccessRequestRequesterName({
      profileDisplayName: row.requester.profile?.displayName,
      firstName: row.requester.firstName,
      lastName: row.requester.lastName,
      username: row.requester.username,
      decrypt: (stored) => this.crypto.decryptString(stored),
    });

    return {
      id: row.id,
      sectionId,
      sectionTitle: SHAREABLE_BIODATA_SECTION_TITLES[sectionId] ?? row.sectionId,
      status,
      message: row.message,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      decidedAt: row.decidedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      requester: {
        id: row.requester.id,
        displayName: requesterName,
        username: row.requester.username,
      },
    };
  }
}

function forbidden(message: string): ForbiddenException {
  return new ForbiddenException(message);
}
