import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  Gender,
  MarriageConfirmationStatus,
  MarriageRecordStatus,
  Prisma,
  UserNotificationType,
  UserStatus,
} from '@soulsync/db';
import type {
  CreateMarriageConfirmationDto,
  MarriageConfirmationDto,
  MarriageConfirmationListDto,
  MarriageConfirmationPartyReviewDto,
  MarriageConfirmationPartySoulSyncDto,
  MarriageConfirmationReviewDto,
  MarriageConfirmationUserDto,
  MemberConfirmedMarriageDto,
} from '@soulsync/shared-types/marriage-confirmation';
import type { MarriageRecordListDto } from '@soulsync/shared-types/marriage-record';
import { maxMarriageSlotsForGender } from '@soulsync/shared-types/marriage-record';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { resolveEditorGrantMemberLabel } from '../biodata-editor/biodata-editor-member-label';
import { ActivityLogRecorder } from '../activity-log/activity-log.recorder';
import { memberBiodataLinkPath } from '../activity-log/activity-log.builder';
import { MarriageRecordService } from '../marriage-record/marriage-record.service';
import {
  canViewPendingMarriageReview,
  countActiveConfirmedMarriages,
  countActiveConfirmedMarriagesForCapacity,
  hasConfirmedRegistrySlotForConfirmation,
  duplicateMarriageConfirmationMessage,
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
    @Inject(forwardRef(() => MarriageRecordService))
    private readonly marriageRecords: MarriageRecordService,
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
        row.status === MarriageConfirmationStatus.DIVORCED ||
        row.status === MarriageConfirmationStatus.DECEASED,
    );

    return {
      viewerUserId: userId,
      pendingIncoming: pendingIncoming.map((row) => this.toDto(row)),
      pendingOutgoing: pendingOutgoing.map((row) => this.toDto(row)),
      confirmed: confirmed.map((row) => this.toDto(row)),
      history: history.map((row) => this.toDto(row)),
    };
  }

  async getReview(viewerUserId: string, id: string): Promise<MarriageConfirmationReviewDto> {
    await this.ensureActiveUser(viewerUserId);
    const row = await this.prisma.client.marriageConfirmation.findUnique({
      where: { id },
      include: marriageInclude,
    });
    if (!row) {
      throw new NotFoundException('Marriage confirmation not found');
    }
    if (!canViewPendingMarriageReview(row, viewerUserId)) {
      throw new ForbiddenException(
        'This review is only available for pending requests you are part of',
      );
    }
    if (!row.partnerUserId || !row.partner) {
      throw new BadRequestException('This request has no linked partner');
    }

    const [initiatorRegistry, partnerRegistry, initiatorSoulSync, partnerSoulSync] =
      await Promise.all([
        this.marriageRecords.listMine(row.initiatorUserId),
        this.marriageRecords.listMine(row.partnerUserId),
        this.listSoulSyncSummaryForUser(row.initiatorUserId),
        this.listSoulSyncSummaryForUser(row.partnerUserId),
      ]);

    const buildParty = (
      userId: string,
      user: MarriageUser,
      registry: MarriageRecordListDto,
      soulSync: MarriageConfirmationPartySoulSyncDto,
    ): MarriageConfirmationPartyReviewDto => ({
      userId,
      displayName: this.displayLabel(user),
      gender: user.profile?.gender ?? null,
      registry,
      soulSync,
    });

    return {
      confirmation: this.toDto(row),
      initiator: buildParty(
        row.initiatorUserId,
        row.initiator,
        initiatorRegistry,
        initiatorSoulSync,
      ),
      partner: buildParty(row.partnerUserId, row.partner, partnerRegistry, partnerSoulSync),
    };
  }

  private async listSoulSyncSummaryForUser(
    userId: string,
  ): Promise<MarriageConfirmationPartySoulSyncDto> {
    const rows = await this.prisma.client.marriageConfirmation.findMany({
      where: {
        OR: [{ initiatorUserId: userId }, { partnerUserId: userId }],
      },
      orderBy: [{ marriageDate: 'desc' }, { createdAt: 'desc' }],
      include: marriageInclude,
    });
    const confirmed = rows.filter((r) => r.status === MarriageConfirmationStatus.CONFIRMED);
    const history = rows.filter(
      (r) =>
        r.status === MarriageConfirmationStatus.DIVORCED ||
        r.status === MarriageConfirmationStatus.DECEASED,
    );
    return {
      confirmed: confirmed.map((r) => this.toDto(r)),
      history: history.map((r) => this.toDto(r)),
    };
  }

  async listConfirmedForUser(ownerUserId: string): Promise<MemberConfirmedMarriageDto[]> {
    const showMarriagePartnerOnPublicBiodata =
      await this.loadShowMarriagePartnerOnPublicBiodata(ownerUserId);

    const rows = await this.prisma.client.marriageConfirmation.findMany({
      where: {
        status: MarriageConfirmationStatus.CONFIRMED,
        OR: [{ initiatorUserId: ownerUserId }, { partnerUserId: ownerUserId }],
      },
      orderBy: [{ marriageDate: 'desc' }, { confirmedAt: 'desc' }],
      include: marriageInclude,
    });

    return rows.map((row) => {
      const partnerUser = row.initiatorUserId === ownerUserId ? row.partner : row.initiator;
      return {
        marriageDate: formatMarriageDateOnly(row.marriageDate),
        partner:
          showMarriagePartnerOnPublicBiodata && partnerUser ? this.toUserDto(partnerUser) : null,
      };
    });
  }

  async getShowMarriagePartnerOnPublicBiodata(userId: string): Promise<boolean> {
    await this.ensureActiveUser(userId);
    return this.loadShowMarriagePartnerOnPublicBiodata(userId);
  }

  async createSelfConfirmedForRegistry(
    userId: string,
    marriageDateIso: string,
  ): Promise<MarriageConfirmationDto> {
    const initiator = await this.ensureActiveUserWithProfile(userId);
    let marriageDate: Date;
    try {
      marriageDate = parseMarriageDateInput(marriageDateIso);
    } catch {
      throw new BadRequestException('Marriage date must be YYYY-MM-DD');
    }
    await this.assertConfirmedMarriageCapacity(userId, initiator.profile!.gender);

    const existingSolo = await this.prisma.client.marriageConfirmation.findFirst({
      where: {
        initiatorUserId: userId,
        partnerUserId: null,
        marriageDate,
        status: MarriageConfirmationStatus.CONFIRMED,
      },
      select: { id: true },
    });
    if (existingSolo) {
      throw new BadRequestException(
        'You already have a confirmed marriage on record for that date.',
      );
    }

    const now = new Date();
    const row = await this.prisma.client.$transaction(async (tx) => {
      let saved: MarriageRow;
      try {
        saved = await tx.marriageConfirmation.create({
          data: {
            tenantId: initiator.tenantId,
            initiatorUserId: userId,
            partnerUserId: null,
            marriageDate,
            status: MarriageConfirmationStatus.CONFIRMED,
            respondedAt: now,
            confirmedAt: now,
          },
          include: marriageInclude,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new BadRequestException(
            'You already have a confirmed marriage on record for that date.',
          );
        }
        throw error;
      }
      await tx.profile.update({
        where: { userId },
        data: { hasConfirmedMarriage: true },
      });
      return saved;
    });

    return this.toDto(row);
  }

  async create(
    initiatorUserId: string,
    body: CreateMarriageConfirmationDto,
  ): Promise<MarriageConfirmationDto> {
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

    await this.assertConfirmedMarriageCapacity(initiatorUserId, initiator.profile!.gender);

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

    const duplicate = await this.prisma.client.marriageConfirmation.findFirst({
      where: { initiatorUserId, partnerUserId, marriageDate },
      select: { status: true },
    });
    if (duplicate) {
      throw new BadRequestException(duplicateMarriageConfirmationMessage(duplicate.status));
    }

    let row: MarriageRow;
    try {
      row = await this.prisma.client.marriageConfirmation.create({
        data: {
          tenantId: initiator.tenantId,
          initiatorUserId,
          partnerUserId,
          marriageDate,
          status: MarriageConfirmationStatus.PENDING,
        },
        include: marriageInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'A marriage confirmation already exists for this member and date.',
        );
      }
      throw error;
    }

    if (!row.partner) {
      throw new NotFoundException('Member not found');
    }

    const initiatorLabel = this.displayLabel(row.initiator);
    const partnerLabel = this.displayLabel(row.partner);
    const dateLabel = formatMarriageDateOnly(row.marriageDate);

    await this.notifyUser(
      partnerUserId,
      initiator.tenantId,
      UserNotificationType.MARRIAGE_CONFIRMATION_REQUEST,
      {
        title: 'Marriage confirmation request',
        body: `${initiatorLabel} asked you to confirm marriage on ${dateLabel}`,
        linkPath: DASHBOARD_BIODATA_PATH,
      },
    );

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

    const partnerProfile = await this.prisma.client.profile.findUnique({
      where: { userId: partnerUserId },
      select: { gender: true },
    });
    const initiatorProfile = await this.prisma.client.profile.findUnique({
      where: { userId: row.initiatorUserId },
      select: { gender: true },
    });
    if (!partnerProfile?.gender || !initiatorProfile?.gender) {
      throw new BadRequestException('Set gender on biodata before confirming marriage');
    }
    await this.assertConfirmedMarriageCapacityForAccept(
      partnerUserId,
      partnerProfile.gender,
      row.id,
      'partner',
    );
    await this.assertConfirmedMarriageCapacityForAccept(
      row.initiatorUserId,
      initiatorProfile.gender,
      row.id,
      'initiator',
    );

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

      const marriedUserIds = [saved.initiatorUserId, saved.partnerUserId].filter(
        (id): id is string => id != null,
      );
      await tx.profile.updateMany({
        where: { userId: { in: marriedUserIds } },
        data: { hasConfirmedMarriage: true },
      });

      return saved;
    });

    if (!updated.partner || !updated.partnerUserId) {
      throw new NotFoundException('Marriage confirmation not found');
    }

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
      this.notifyUser(
        updated.partnerUserId,
        updated.tenantId,
        UserNotificationType.MARRIAGE_CONFIRMED,
        {
          title: 'Marriage confirmed',
          body: `You confirmed marriage with ${initiatorLabel} on ${dateLabel}`,
          linkPath: memberBiodataLinkPath(updated.partner.username),
        },
      ),
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
    const snapshot = await this.prisma.client.marriageConfirmation.update({
      where: { id: row.id },
      data: {
        status: MarriageConfirmationStatus.DECLINED,
        respondedAt: now,
      },
      include: marriageInclude,
    });

    if (!snapshot.partner) {
      throw new NotFoundException('Marriage confirmation not found');
    }

    const initiatorLabel = this.displayLabel(snapshot.initiator);
    const partnerLabel = this.displayLabel(snapshot.partner);

    this.activityLog.marriageConfirmationDecided({
      initiator: this.userSnippet(snapshot.initiator, snapshot.tenantId),
      partner: this.userSnippet(snapshot.partner, snapshot.tenantId),
      initiatorTitle: `${partnerLabel} declined your marriage confirmation`,
      partnerTitle: `You declined ${initiatorLabel}'s marriage confirmation`,
      linkPath: DASHBOARD_BIODATA_PATH,
    });

    const dto = this.toDto(snapshot);
    await this.prisma.client.marriageConfirmation.delete({ where: { id: row.id } });
    return dto;
  }

  async cancel(initiatorUserId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadRowForInitiator(id, initiatorUserId);
    const dto = this.toDto(row);
    await this.prisma.client.marriageConfirmation.delete({ where: { id: row.id } });
    return dto;
  }

  async requestDivorce(userId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadConfirmedMutualRow(id, userId);
    if (row.divorceRequestedByUserId) {
      throw new BadRequestException('A divorce request is already pending for this marriage');
    }
    const updated = await this.prisma.client.marriageConfirmation.update({
      where: { id: row.id },
      data: {
        divorceRequestedByUserId: userId,
        divorceRequestedAt: new Date(),
      },
      include: marriageInclude,
    });
    return this.toDto(updated);
  }

  async cancelDivorceRequest(userId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadConfirmedMutualRow(id, userId);
    if (row.divorceRequestedByUserId !== userId) {
      throw new ForbiddenException('Only the member who requested divorce can cancel it');
    }
    const updated = await this.prisma.client.marriageConfirmation.update({
      where: { id: row.id },
      data: {
        divorceRequestedByUserId: null,
        divorceRequestedAt: null,
      },
      include: marriageInclude,
    });
    return this.toDto(updated);
  }

  async acceptDivorce(userId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadConfirmedMutualRow(id, userId);
    if (!row.divorceRequestedByUserId) {
      throw new BadRequestException('No divorce request is pending for this marriage');
    }
    if (row.divorceRequestedByUserId === userId) {
      throw new BadRequestException('Your spouse must confirm the divorce');
    }
    const updated = await this.finalizeConfirmationEnd(row.id, MarriageConfirmationStatus.DIVORCED);
    return this.toDto(updated);
  }

  async declineDivorceRequest(userId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadConfirmedMutualRow(id, userId);
    if (!row.divorceRequestedByUserId || row.divorceRequestedByUserId === userId) {
      throw new BadRequestException('No divorce request from your spouse to decline');
    }
    const updated = await this.prisma.client.marriageConfirmation.update({
      where: { id: row.id },
      data: {
        divorceRequestedByUserId: null,
        divorceRequestedAt: null,
      },
      include: marriageInclude,
    });
    return this.toDto(updated);
  }

  async markDeceased(userId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadConfirmedParticipantRow(id, userId);
    const updated = await this.finalizeConfirmationEnd(row.id, MarriageConfirmationStatus.DECEASED);
    return this.toDto(updated);
  }

  /** Immediate divorce when the spouse is not linked on SoulSync (registry-only confirmation). */
  async markDivorced(userId: string, id: string): Promise<MarriageConfirmationDto> {
    const row = await this.loadConfirmedParticipantRow(id, userId);
    if (row.partnerUserId) {
      throw new BadRequestException(
        'For a linked SoulSync spouse, request divorce and wait for their confirmation',
      );
    }
    const updated = await this.finalizeConfirmationEnd(row.id, MarriageConfirmationStatus.DIVORCED);
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

  private async loadConfirmedMutualRow(id: string, userId: string): Promise<MarriageRow> {
    const row = await this.loadConfirmedParticipantRow(id, userId);
    if (!row.partnerUserId) {
      throw new BadRequestException('This action applies to mutual SoulSync marriages only');
    }
    return row;
  }

  private async loadConfirmedParticipantRow(id: string, userId: string): Promise<MarriageRow> {
    const row = await this.prisma.client.marriageConfirmation.findUnique({
      where: { id },
      include: marriageInclude,
    });
    if (!row) {
      throw new NotFoundException('Marriage confirmation not found');
    }
    if (row.status !== MarriageConfirmationStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed marriages can be updated');
    }
    const isInitiator = row.initiatorUserId === userId;
    const isPartner = row.partnerUserId != null && row.partnerUserId === userId;
    if (!isInitiator && !isPartner) {
      throw new ForbiddenException('You are not part of this marriage confirmation');
    }
    if (!row.partnerUserId && !isInitiator) {
      throw new ForbiddenException('Only the profile owner can update this marriage entry');
    }
    return row;
  }

  private async finalizeConfirmationEnd(
    id: string,
    status: typeof MarriageConfirmationStatus.DIVORCED | typeof MarriageConfirmationStatus.DECEASED,
  ): Promise<MarriageRow> {
    const registryStatus =
      status === MarriageConfirmationStatus.DIVORCED
        ? MarriageRecordStatus.DIVORCED
        : MarriageRecordStatus.DECEASED;

    const updated = await this.prisma.client.$transaction(async (tx) => {
      const saved = await tx.marriageConfirmation.update({
        where: { id },
        data: {
          status,
          divorceRequestedByUserId: null,
          divorceRequestedAt: null,
        },
        include: marriageInclude,
      });
      await tx.marriageRecord.updateMany({
        where: { marriageConfirmationId: id },
        data: { status: registryStatus },
      });
      return saved;
    });

    const userIds = [updated.initiatorUserId, updated.partnerUserId].filter(
      (uid): uid is string => uid != null,
    );
    await Promise.all(userIds.map((uid) => this.refreshHasConfirmedMarriage(uid)));

    return updated;
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

  private async resolveMemberUserIdByUsername(
    tenantId: string,
    usernameRaw: string,
  ): Promise<string> {
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

  private async loadShowMarriagePartnerOnPublicBiodata(userId: string): Promise<boolean> {
    const profile = await this.prisma.client.profile.findUnique({
      where: { userId },
      select: { showMarriagePartnerOnPublicBiodata: true },
    });
    return profile?.showMarriagePartnerOnPublicBiodata === true;
  }

  async refreshHasConfirmedMarriage(userId: string): Promise<void> {
    const profile = await this.prisma.client.profile.findUnique({
      where: { userId },
      select: { gender: true },
    });
    const gender = profile?.gender;
    const count =
      gender != null
        ? await countActiveConfirmedMarriagesForCapacity(this.prisma.client, userId, gender)
        : await countActiveConfirmedMarriages(this.prisma.client, userId);
    await this.prisma.client.profile.update({
      where: { userId },
      data: { hasConfirmedMarriage: count > 0 },
    });
  }

  async countActiveConfirmedMarriagesForUser(userId: string, gender: Gender): Promise<number> {
    return countActiveConfirmedMarriagesForCapacity(this.prisma.client, userId, gender);
  }

  /** When registry ends first: update linked SoulSync row without re-touching registry status. */
  async syncConfirmationEndFromRegistry(
    confirmationId: string,
    status: typeof MarriageConfirmationStatus.DIVORCED | typeof MarriageConfirmationStatus.DECEASED,
  ): Promise<void> {
    const row = await this.prisma.client.marriageConfirmation.findUnique({
      where: { id: confirmationId },
      include: marriageInclude,
    });
    if (!row || row.status !== MarriageConfirmationStatus.CONFIRMED) {
      return;
    }
    const updated = await this.prisma.client.marriageConfirmation.update({
      where: { id: confirmationId },
      data: {
        status,
        divorceRequestedByUserId: null,
        divorceRequestedAt: null,
      },
      include: marriageInclude,
    });
    const userIds = [updated.initiatorUserId, updated.partnerUserId].filter(
      (uid): uid is string => uid != null,
    );
    await Promise.all(userIds.map((uid) => this.refreshHasConfirmedMarriage(uid)));
  }

  private async assertConfirmedMarriageCapacity(userId: string, gender: Gender): Promise<void> {
    const maxActive = maxMarriageSlotsForGender(gender);
    if (maxActive <= 0) {
      throw new BadRequestException('Set your gender on biodata before confirming marriage');
    }
    const confirmedCount = await countActiveConfirmedMarriagesForCapacity(
      this.prisma.client,
      userId,
      gender,
    );
    if (confirmedCount >= maxActive) {
      if (gender === Gender.MALE) {
        throw new BadRequestException(
          'You have reached the maximum number of confirmed registry wives (4). Mark a marriage divorced or deceased, or reopen an ended slot, before adding another.',
        );
      }
      throw new BadRequestException('You have reached the maximum number of confirmed marriages');
    }
  }

  /** Accept may only link SoulSync for a registry wife already counted toward the male cap. */
  private async assertConfirmedMarriageCapacityForAccept(
    userId: string,
    gender: Gender,
    pendingConfirmationId: string,
    party: 'partner' | 'initiator',
  ): Promise<void> {
    if (gender === Gender.MALE) {
      const alreadyOnRegistry = await hasConfirmedRegistrySlotForConfirmation(
        this.prisma.client,
        userId,
        pendingConfirmationId,
      );
      if (alreadyOnRegistry) {
        return;
      }
      const maxActive = maxMarriageSlotsForGender(gender);
      const registryConfirmed = await countActiveConfirmedMarriagesForCapacity(
        this.prisma.client,
        userId,
        gender,
      );
      if (registryConfirmed >= maxActive) {
        throw new BadRequestException(
          party === 'partner'
            ? 'You have reached the maximum number of confirmed registry wives (4). Mark a marriage divorced or deceased, or reopen an ended slot, before confirming another.'
            : 'The member who sent this request already has four confirmed registry wives and cannot confirm another marriage on SoulSync.',
        );
      }
      return;
    }
    try {
      await this.assertConfirmedMarriageCapacity(userId, gender);
    } catch (error) {
      if (
        error instanceof BadRequestException &&
        party === 'initiator' &&
        error.message.includes('maximum number of confirmed marriages')
      ) {
        throw new BadRequestException(
          'The member who sent this request has reached the maximum number of confirmed marriages.',
        );
      }
      throw error;
    }
  }

  private displayLabel(user: MarriageUser | null): string {
    if (!user) {
      return 'Member';
    }
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

  private toUserDto(user: MarriageUser | null): MarriageConfirmationUserDto | null {
    if (!user) {
      return null;
    }
    return {
      userId: user.id,
      username: user.username,
      displayName: this.displayLabel(user),
      avatarUrl: user.avatarUrl ?? null,
    };
  }

  private toDto(row: MarriageRow): MarriageConfirmationDto {
    const partner = this.toUserDto(row.partner);
    return {
      id: row.id,
      status: row.status,
      marriageDate: formatMarriageDateOnly(row.marriageDate),
      initiatorUserId: row.initiatorUserId,
      partnerUserId: row.partnerUserId,
      initiatedAt: row.initiatedAt.toISOString(),
      respondedAt: row.respondedAt?.toISOString() ?? null,
      confirmedAt: row.confirmedAt?.toISOString() ?? null,
      divorceRequestedByUserId: row.divorceRequestedByUserId,
      divorceRequestedAt: row.divorceRequestedAt?.toISOString() ?? null,
      initiator: this.toUserDto(row.initiator)!,
      partner,
    };
  }

  private userSnippet(user: MarriageUser | null, tenantId: string) {
    if (!user) {
      throw new NotFoundException('User not found');
    }
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
