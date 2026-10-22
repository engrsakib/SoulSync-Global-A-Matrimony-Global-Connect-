import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MarriageConfirmationStatus,
  Prisma,
  UserNotificationType,
  UserStatus,
} from '@soulsync/db';
import type {
  CreateMarriageConfirmationDto,
  MarriageConfirmationDto,
  MarriageConfirmationListDto,
  MemberConfirmedMarriageDto,
} from '@soulsync/shared-types/marriage-confirmation';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { resolveEditorGrantMemberLabel } from '../biodata-editor/biodata-editor-member-label';
import { ActivityLogRecorder } from '../activity-log/activity-log.recorder';
import { memberBiodataLinkPath } from '../activity-log/activity-log.builder';
import {
  formatMarriageDateOnly,
  isOppositeGenderPair,
  parseMarriageDateInput,
} from './marriage-confirmation.util';

type MarriageRow = Prisma.MarriageConfirmationGetPayload<{ include: typeof marriageInclude }>;

type MarriageUser = MarriageRow['initiator'];

const DASHBOARD_BIODATA_PATH = '/dashboard/biodata';

@Injectable()
export class MarriageConfirmationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldCrypto: FieldEncryptionService,
    private readonly activityLog: ActivityLogRecorder,
  ) {}

  async listMine(userId: string): Promise<MarriageConfirmationListDto> {
    await this.ensureActiveUser(userId);
    const rows = await this.prisma.client.marriageConfirmation.findMany({
      where: {
        OR: [{ initiatorUserId: userId }, { partnerUserId: userId }],
      },
      orderBy: [{ marriageDate: 'desc' }, { createdAt: 'desc' }],
      include: marriageInclude,
    });

    const pendingIncoming = rows.filter(
      (row) => row.status === MarriageConfirmationStatus.PENDING && row.partnerUserId === userId,
    );
    const pendingOutgoing = rows.filter(
      (row) => row.status === MarriageConfirmationStatus.PENDING && row.initiatorUserId === userId,
    );
    const confirmed = rows.filter((row) => row.status === MarriageConfirmationStatus.CONFIRMED);
    const history = rows.filter(
      (row) =>
        row.status === MarriageConfirmationStatus.DECLINED ||
        row.status === MarriageConfirmationStatus.CANCELLED,
    );

    return {
      viewerUserId: userId,
      pendingIncoming: pendingIncoming.map((row) => this.toDto(row)),
      pendingOutgoing: pendingOutgoing.map((row) => this.toDto(row)),
      confirmed: confirmed.map((row) => this.toDto(row)),
      history: history.map((row) => this.toDto(row)),
    };
  }

  async listConfirmedForUser(ownerUserId: string): Promise<MemberConfirmedMarriageDto[]> {
    const rows = await this.prisma.client.marriageConfirmation.findMany({
      where: {
        status: MarriageConfirmationStatus.CONFIRMED,
        OR: [{ initiatorUserId: ownerUserId }, { partnerUserId: ownerUserId }],
      },
      orderBy: [{ marriageDate: 'desc' }, { confirmedAt: 'desc' }],
      include: marriageInclude,
    });

    return rows.map((row) => {
      const partnerUser =
        row.initiatorUserId === ownerUserId ? row.partner : row.initiator;
      return {
        marriageDate: formatMarriageDateOnly(row.marriageDate),
        partner: this.toUserDto(partnerUser),
      };
    });
  }

  async create(initiatorUserId: string, body: CreateMarriageConfirmationDto): Promise<MarriageConfirmationDto> {
    const initiator = await this.ensureActiveUserWithProfile(initiatorUserId);

    const partnerUserId = await this.resolveMemberUserIdByUsername(
      initiator.tenantId,
      body.partnerUsername,
    );
    if (partnerUserId === initiatorUserId) {
      throw new BadRequestException('You cannot confirm marriage with yourself');
    }

    const partner = await this.prisma.client.user.findUnique({
      where: { id: partnerUserId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        profile: { select: { displayName: true, gender: true } },
      },
    });
    if (!partner?.profile || partner.status !== UserStatus.ACTIVE) {
      throw new NotFoundException('Member not found');
    }
    if (partner.tenantId !== initiator.tenantId) {
      throw new NotFoundException('Member not found');
    }

    if (!isOppositeGenderPair(initiator.profile!.gender, partner.profile.gender)) {
      throw new BadRequestException(
        'Marriage confirmation requires an opposite-gender member (male with female, or female with male).',
      );
    }

    let marriageDate: Date;
    try {
      marriageDate = parseMarriageDateInput(body.marriageDate);
    } catch {
      throw new BadRequestException('Marriage date must be YYYY-MM-DD');
    }

    const pendingOutgoing = await this.prisma.client.marriageConfirmation.count({
      where: {
        initiatorUserId,
        status: MarriageConfirmationStatus.PENDING,
      },
    });
    if (pendingOutgoing > 0) {
      throw new BadRequestException(
        'You already have a pending marriage confirmation. Cancel it or wait for a response before sending another.',
      );
    }

    const row = await this.prisma.client.marriageConfirmation.create({
      data: {
        tenantId: initiator.tenantId,
        initiatorUserId,
        partnerUserId,
        marriageDate,
        status: MarriageConfirmationStatus.PENDING,
      },
      include: marriageInclude,
    });

    const initiatorLabel = this.displayLabel(row.initiator);
    const partnerLabel = this.displayLabel(row.partner);
    const dateLabel = formatMarriageDateOnly(row.marriageDate);

    await this.notifyUser(partnerUserId, initiator.tenantId, UserNotificationType.MARRIAGE_CONFIRMATION_REQUEST, {
      title: 'Marriage confirmation request',
      body: `${initiatorLabel} asked you to confirm marriage on ${dateLabel}`,
      linkPath: DASHBOARD_BIODATA_PATH,
    });

    this.activityLog.marriageConfirmationRequest({
      initiator: this.userSnippet(row.initiator, row.tenantId),
      partner: this.userSnippet(row.partner, row.tenantId),
      initiatorTitle: `You sent a marriage confirmation to ${partnerLabel}`,
      partnerTitle: `${initiatorLabel} asked you to confirm marriage`,
      body: dateLabel,
      linkPath: DASHBOARD_BIODATA_PATH,
    });

    return this.toDto(row);
  }

  async accept(partnerUserId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadRowForPartner(id, partnerUserId);

    const now = new Date();
    const updated = await this.prisma.client.$transaction(async (tx) => {
      const saved = await tx.marriageConfirmation.update({
        where: { id: row.id },
        data: {
          status: MarriageConfirmationStatus.CONFIRMED,
          respondedAt: now,
          confirmedAt: now,
        },
        include: marriageInclude,
      });

      await tx.profile.updateMany({
        where: { userId: { in: [saved.initiatorUserId, saved.partnerUserId] } },
        data: { hasConfirmedMarriage: true },
      });

      return saved;
    });

    const initiatorLabel = this.displayLabel(updated.initiator);
    const partnerLabel = this.displayLabel(updated.partner);
    const dateLabel = formatMarriageDateOnly(updated.marriageDate);

    await Promise.all([
      this.notifyUser(
        updated.initiatorUserId,
        updated.tenantId,
        UserNotificationType.MARRIAGE_CONFIRMED,
        {
          title: 'Marriage confirmed',
          body: `${partnerLabel} confirmed your marriage on ${dateLabel}`,
          linkPath: memberBiodataLinkPath(updated.initiator.username),
        },
      ),
      this.notifyUser(updated.partnerUserId, updated.tenantId, UserNotificationType.MARRIAGE_CONFIRMED, {
        title: 'Marriage confirmed',
        body: `You confirmed marriage with ${initiatorLabel} on ${dateLabel}`,
        linkPath: memberBiodataLinkPath(updated.partner.username),
      }),
    ]);

    this.activityLog.marriageConfirmationConfirmed({
      initiator: this.userSnippet(updated.initiator, updated.tenantId),
      partner: this.userSnippet(updated.partner, updated.tenantId),
      initiatorTitle: `${partnerLabel} confirmed your marriage`,
      partnerTitle: `You confirmed marriage with ${initiatorLabel}`,
      body: dateLabel,
      linkPathInitiator: memberBiodataLinkPath(updated.initiator.username),
      linkPathPartner: memberBiodataLinkPath(updated.partner.username),
    });

    return this.toDto(updated);
  }

  async decline(partnerUserId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadRowForPartner(id, partnerUserId);
    const now = new Date();
    const updated = await this.prisma.client.marriageConfirmation.update({
      where: { id: row.id },
      data: {
        status: MarriageConfirmationStatus.DECLINED,
        respondedAt: now,
      },
      include: marriageInclude,
    });

    const initiatorLabel = this.displayLabel(updated.initiator);
    const partnerLabel = this.displayLabel(updated.partner);

    this.activityLog.marriageConfirmationDecided({
      initiator: this.userSnippet(updated.initiator, updated.tenantId),
      partner: this.userSnippet(updated.partner, updated.tenantId),
      initiatorTitle: `${partnerLabel} declined your marriage confirmation`,
      partnerTitle: `You declined ${initiatorLabel}'s marriage confirmation`,
      linkPath: DASHBOARD_BIODATA_PATH,
    });

    return this.toDto(updated);
  }

  async cancel(initiatorUserId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadRowForInitiator(id, initiatorUserId);
    const updated = await this.prisma.client.marriageConfirmation.update({
      where: { id: row.id },
      data: { status: MarriageConfirmationStatus.CANCELLED },
      include: marriageInclude,
    });
    return this.toDto(updated);
  }

  private async loadRowForPartner(id: string, partnerUserId: string): Promise<MarriageRow> {
    const row = await this.prisma.client.marriageConfirmation.findUnique({
      where: { id },
      include: marriageInclude,
    });
    if (!row) {
      throw new NotFoundException('Marriage confirmation not found');
    }
    if (row.partnerUserId !== partnerUserId) {
      throw new ForbiddenException('Only the invited partner can respond to this request');
    }
    if (row.status !== MarriageConfirmationStatus.PENDING) {
      throw new BadRequestException('This request is no longer pending');
    }
    return row;
  }

  private async loadRowForInitiator(id: string, initiatorUserId: string): Promise<MarriageRow> {
    const row = await this.prisma.client.marriageConfirmation.findUnique({
      where: { id },
      include: marriageInclude,
    });
    if (!row) {
      throw new NotFoundException('Marriage confirmation not found');
    }
    if (row.initiatorUserId !== initiatorUserId) {
      throw new ForbiddenException('Only the initiator can cancel this request');
    }
    if (row.status !== MarriageConfirmationStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    return row;
  }

  private async resolveMemberUserIdByUsername(tenantId: string, usernameRaw: string): Promise<string> {
    const username = usernameRaw.trim().replace(/^@+/, '').toLowerCase();
    if (!username) {
      throw new NotFoundException('Member not found');
    }

    const user = await this.prisma.client.user.findFirst({
      where: {
        tenantId,
        username: { equals: username, mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    return user.id;
  }

  private async ensureActiveUser(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, deletedAt: true },
    });
    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async ensureActiveUserWithProfile(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        deletedAt: true,
        profile: { select: { gender: true } },
      },
    });
    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE || !user.profile) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private displayLabel(user: MarriageUser): string {
    return (
      resolveEditorGrantMemberLabel(
        {
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileDisplayName: user.profile?.displayName ?? null,
        },
        (stored) => this.fieldCrypto.decryptString(stored),
      ) ?? 'Member'
    );
  }

  private toUserDto(user: MarriageUser) {
    return {
      userId: user.id,
      username: user.username,
      displayName: this.displayLabel(user),
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  private toDto(row: MarriageRow): MarriageConfirmationDto {
    return {
      id: row.id,
      status: row.status,
      marriageDate: formatMarriageDateOnly(row.marriageDate),
      initiatorUserId: row.initiatorUserId,
      partnerUserId: row.partnerUserId,
      initiatedAt: row.initiatedAt.toISOString(),
      respondedAt: row.respondedAt?.toISOString() ?? null,
      confirmedAt: row.confirmedAt?.toISOString() ?? null,
      initiator: this.toUserDto(row.initiator),
      partner: this.toUserDto(row.partner),
    };
  }

  private userSnippet(user: MarriageUser, tenantId: string) {
    return {
      id: user.id,
      tenantId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profile: { displayName: user.profile?.displayName ?? null },
    };
  }

  private async notifyUser(
    userId: string,
    tenantId: string,
    type: UserNotificationType,
    input: { title: string; body: string; linkPath: string },
  ): Promise<void> {
    await this.prisma.client.userNotification.create({
      data: {
        userId,
        tenantId,
        type,
        title: input.title,
        body: input.body,
        linkPath: input.linkPath,
      },
    });
  }
}

const marriageInclude = {
  initiator: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      profile: { select: { displayName: true, gender: true } },
    },
  },
  partner: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      profile: { select: { displayName: true, gender: true } },
    },
  },
} as const;
