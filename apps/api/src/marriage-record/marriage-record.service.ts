import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Gender, MarriageRecordStatus, Prisma, UserStatus } from '@soulsync/db';
import type {
  ConfirmMarriageRecordDto,
  MarriageRecordChildDto,
  MarriageRecordDto,
  MarriageRecordListDto,
  UpdateMarriageRecordStatusDto,
  UpsertMarriageRecordChildrenBatchDto,
  UpsertMarriageRecordDraftDto,
} from '@soulsync/shared-types/marriage-record';
import {
  groupChildrenByMotherSlot,
  isMarriageRecordSlotOccupiedForProgression,
  maxMarriageSlotsForGender,
  spouseRoleForProfileGender,
  canUpdateChildrenOnMarriageRecord,
  validateMarriageRecordChildrenBatch,
  validateMarriageRecordForConfirm,
  validateStatusEndedDate,
} from '@soulsync/shared-types/marriage-record';
import {
  formatMarriageDateOnly,
  parseMarriageDateInput,
} from '../marriage-confirmation/marriage-confirmation.util';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarriageConfirmationService } from '../marriage-confirmation/marriage-confirmation.service';
import {
  buildDraftEncryptedFields,
  buildEncryptedMarriageRecordFields,
  marriageRecordArchiveToDto,
  marriageRecordToDto,
} from './marriage-record.mapper';

@Injectable()
export class MarriageRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldEncryptionService,
    private readonly marriageConfirmations: MarriageConfirmationService,
  ) {}

  async listMine(userId: string): Promise<MarriageRecordListDto> {
    const { gender } = this.requireProfile(await this.ensureUserWithProfile(userId));
    const maxSlots = maxMarriageSlotsForGender(gender);
    const showMarriagePartnerOnPublicBiodata =
      await this.marriageConfirmations.getShowMarriagePartnerOnPublicBiodata(userId);

    const [rows, archiveRows] = await Promise.all([
      this.prisma.client.marriageRecord.findMany({
        where: { userId },
        orderBy: { slotIndex: 'asc' },
      }),
      this.prisma.client.marriageRecordArchive.findMany({
        where: { userId },
        orderBy: { archivedAt: 'desc' },
      }),
    ]);

    const records = rows.map((row) => marriageRecordToDto(this.crypto, row));
    const archivedRecords = archiveRows.map((row) => marriageRecordArchiveToDto(this.crypto, row));
    return {
      viewerUserId: userId,
      gender,
      maxSlots,
      showMarriagePartnerOnPublicBiodata,
      records,
      archivedRecords,
      nextEditableSlot: this.resolveNextEditableSlot(gender, records, maxSlots),
    };
  }

  async upsertDraft(
    userId: string,
    slotIndexRaw: number,
    body: UpsertMarriageRecordDraftDto,
  ): Promise<MarriageRecordDto> {
    const slotIndex = this.parseSlotIndex(slotIndexRaw);
    const user = await this.ensureUserWithProfile(userId);
    const { gender } = this.requireProfile(user);
    const maxSlots = maxMarriageSlotsForGender(gender);
    if (slotIndex > maxSlots || slotIndex < 1) {
      throw new BadRequestException('Invalid marriage slot');
    }
    await this.assertSlotUnlocked(userId, slotIndex, gender);

    const existing = await this.prisma.client.marriageRecord.findUnique({
      where: { userId_slotIndex: { userId, slotIndex } },
    });
    if (existing && existing.status !== MarriageRecordStatus.DRAFT) {
      throw new BadRequestException('This marriage record is locked and cannot be edited');
    }

    const partnerUsername = body.partnerUsername?.trim().replace(/^@+/, '').toLowerCase() || null;
    const encrypted = buildDraftEncryptedFields(this.crypto, {
      spouseName: body.spouseName,
      spousePhone: body.spousePhone,
      spouseTelegram: body.spouseTelegram ?? undefined,
      spouseWhatsApp: body.spouseWhatsApp ?? undefined,
      children: body.children,
      marriageDate: body.marriageDate,
    });

    if (body.children !== undefined) {
      const list = await this.listMine(userId);
      const batchCheck = validateMarriageRecordChildrenBatch(body.children, list.records);
      if (!batchCheck.ok) {
        throw new BadRequestException(batchCheck.message);
      }
    }

    const childrenGrouped =
      body.children !== undefined ? groupChildrenByMotherSlot(body.children, slotIndex) : null;
    const slotChildren = childrenGrouped?.get(slotIndex);
    const encryptedForSlot =
      slotChildren !== undefined
        ? buildDraftEncryptedFields(this.crypto, {
            ...body,
            children: slotChildren,
          })
        : encrypted;

    const row = await this.prisma.client.marriageRecord.upsert({
      where: { userId_slotIndex: { userId, slotIndex } },
      create: {
        tenantId: user.tenantId,
        userId,
        slotIndex,
        spouseRole: spouseRoleForProfileGender(gender),
        status: MarriageRecordStatus.DRAFT,
        partnerUsernameHint: partnerUsername,
        ...encryptedForSlot,
      },
      update: {
        partnerUsernameHint: partnerUsername,
        ...encryptedForSlot,
      },
    });

    if (childrenGrouped) {
      await this.applyChildrenToOtherDraftSlots(userId, slotIndex, childrenGrouped);
    }

    return marriageRecordToDto(this.crypto, row);
  }

  async upsertChildrenBatch(
    userId: string,
    body: UpsertMarriageRecordChildrenBatchDto,
  ): Promise<MarriageRecordListDto> {
    const { gender } = this.requireProfile(await this.ensureUserWithProfile(userId));
    const maxSlots = maxMarriageSlotsForGender(gender);
    const listBefore = await this.listMine(userId);
    const flatChildren: MarriageRecordChildDto[] = [];
    for (const entry of body.slots ?? []) {
      for (const child of entry.children ?? []) {
        flatChildren.push({
          ...child,
          motherSlotIndex: child.motherSlotIndex ?? entry.slotIndex,
        });
      }
    }
    const batchCheck = validateMarriageRecordChildrenBatch(flatChildren, listBefore.records);
    if (!batchCheck.ok) {
      throw new BadRequestException(batchCheck.message);
    }

    for (const entry of body.slots ?? []) {
      const slotIndex = entry.slotIndex;
      if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > maxSlots) {
        throw new BadRequestException('Invalid slot index in children batch');
      }
      const existing = await this.prisma.client.marriageRecord.findUnique({
        where: { userId_slotIndex: { userId, slotIndex } },
      });
      if (existing && !canUpdateChildrenOnMarriageRecord(existing.status)) {
        throw new BadRequestException(`Children cannot be edited on marriage slot ${slotIndex}`);
      }
      const childrenEnc = this.crypto.encryptJson({
        items: entry.children ?? [],
      }) as Prisma.InputJsonValue;
      if (existing) {
        await this.prisma.client.marriageRecord.update({
          where: { id: existing.id },
          data: { childrenEnc },
        });
      } else {
        const user = await this.ensureUserWithProfile(userId);
        await this.assertSlotUnlocked(userId, slotIndex, gender);
        await this.prisma.client.marriageRecord.create({
          data: {
            tenantId: user.tenantId,
            userId,
            slotIndex,
            spouseRole: spouseRoleForProfileGender(gender),
            status: MarriageRecordStatus.DRAFT,
            childrenEnc,
          },
        });
      }
    }

    return this.listMine(userId);
  }

  async beginRemarriage(userId: string, slotIndexRaw: number): Promise<MarriageRecordDto> {
    const slotIndex = this.parseSlotIndex(slotIndexRaw);
    if (slotIndex !== 1) {
      throw new BadRequestException('Remarriage is only supported for the first marriage slot');
    }
    const user = await this.ensureUserWithProfile(userId);
    const { gender } = this.requireProfile(user);
    if (gender !== Gender.FEMALE) {
      throw new BadRequestException(
        'This action is only for female members with one marriage slot',
      );
    }

    const row = await this.prisma.client.marriageRecord.findUnique({
      where: { userId_slotIndex: { userId, slotIndex: 1 } },
    });
    if (!row) {
      throw new BadRequestException('No marriage record to reopen');
    }
    if (
      row.status !== MarriageRecordStatus.DIVORCED &&
      row.status !== MarriageRecordStatus.DECEASED
    ) {
      throw new BadRequestException(
        'You can start a new husband entry only after marking the previous one divorced or deceased',
      );
    }

    const confirmedCount =
      await this.marriageConfirmations.countActiveConfirmedMarriagesForUser(userId);
    if (confirmedCount >= 1) {
      throw new BadRequestException('You already have an active confirmed marriage');
    }

    const created = await this.prisma.client.$transaction(async (tx) => {
      await tx.marriageRecordArchive.create({
        data: {
          tenantId: row.tenantId,
          userId: row.userId,
          originalSlotIndex: row.slotIndex,
          spouseRole: row.spouseRole,
          endedStatus: row.status,
          marriageDate: row.marriageDate,
          statusEndedAt: row.statusEndedAt,
          lockedAt: row.lockedAt,
          spouseNameEnc: row.spouseNameEnc,
          spousePhoneEnc: row.spousePhoneEnc,
          spouseTelegramEnc: row.spouseTelegramEnc,
          spouseWhatsAppEnc: row.spouseWhatsAppEnc,
          childrenEnc: row.childrenEnc ?? undefined,
          linkedPartnerUserId: row.linkedPartnerUserId,
          partnerUsernameHint: row.partnerUsernameHint,
          marriageConfirmationId: row.marriageConfirmationId,
        },
      });
      await tx.marriageRecord.delete({ where: { id: row.id } });
      return tx.marriageRecord.create({
        data: {
          tenantId: user.tenantId,
          userId,
          slotIndex: 1,
          spouseRole: spouseRoleForProfileGender(gender),
          status: MarriageRecordStatus.DRAFT,
        },
      });
    });

    return marriageRecordToDto(this.crypto, created);
  }

  async confirmSlot(
    userId: string,
    slotIndexRaw: number,
    body: ConfirmMarriageRecordDto,
  ): Promise<MarriageRecordDto> {
    if (body.acknowledgeIrreversible !== true) {
      throw new BadRequestException(
        'You must acknowledge that marriage details cannot be edited after confirming',
      );
    }

    const slotIndex = this.parseSlotIndex(slotIndexRaw);
    const { gender } = this.requireProfile(await this.ensureUserWithProfile(userId));

    const row = await this.prisma.client.marriageRecord.findUnique({
      where: { userId_slotIndex: { userId, slotIndex } },
    });
    if (!row || row.status !== MarriageRecordStatus.DRAFT) {
      throw new BadRequestException('Save a draft for this marriage slot before confirming');
    }

    const draftDto = marriageRecordToDto(this.crypto, row);
    const allRows = await this.prisma.client.marriageRecord.findMany({
      where: { userId },
      orderBy: { slotIndex: 'asc' },
    });
    const allDtos = allRows.map((r) => marriageRecordToDto(this.crypto, r));
    const namedMotherSlots = allDtos.filter((r) => r.spouseName?.trim()).map((r) => r.slotIndex);

    const validation = validateMarriageRecordForConfirm(
      {
        spouseName: draftDto.spouseName ?? undefined,
        marriageDate: draftDto.marriageDate ?? undefined,
        spousePhone: draftDto.spousePhone ?? undefined,
        spouseTelegram: draftDto.spouseTelegram ?? undefined,
        spouseWhatsApp: draftDto.spouseWhatsApp ?? undefined,
        partnerUsername: draftDto.partnerUsername ?? undefined,
        children: draftDto.children,
      },
      'BD',
      {
        profileGender: gender,
        namedMotherSlots,
        confirmSlotIndex: slotIndex,
        records: allDtos,
      },
    );
    if (!validation.ok) {
      throw new BadRequestException(validation.message);
    }

    const confirmedCount =
      await this.marriageConfirmations.countActiveConfirmedMarriagesForUser(userId);
    const maxActive = maxMarriageSlotsForGender(gender);
    if (confirmedCount >= maxActive) {
      throw new BadRequestException('You have reached the maximum number of confirmed marriages');
    }

    const encrypted = buildEncryptedMarriageRecordFields(this.crypto, validation.normalized);
    const now = new Date();

    let marriageConfirmationId: string | null = null;
    let linkedPartnerUserId: string | null = null;

    if (validation.normalized.partnerUsername) {
      const confirmation = await this.marriageConfirmations.create(userId, {
        partnerUsername: validation.normalized.partnerUsername,
        marriageDate: validation.normalized.marriageDate,
      });
      marriageConfirmationId = confirmation.id;
      linkedPartnerUserId = confirmation.partnerUserId;
    } else {
      const confirmation = await this.marriageConfirmations.createSelfConfirmedForRegistry(
        userId,
        validation.normalized.marriageDate,
      );
      marriageConfirmationId = confirmation.id;
    }

    const updated = await this.prisma.client.$transaction(async (tx) => {
      const saved = await tx.marriageRecord.update({
        where: { id: row.id },
        data: {
          status: MarriageRecordStatus.CONFIRMED,
          lockedAt: now,
          marriageConfirmationId,
          linkedPartnerUserId,
          partnerUsernameHint: validation.normalized.partnerUsername,
          ...encrypted,
        },
      });
      await tx.profile.updateMany({
        where: { userId },
        data: { hasConfirmedMarriage: true },
      });
      return saved;
    });

    return marriageRecordToDto(this.crypto, updated);
  }

  async updateStatus(
    userId: string,
    recordId: string,
    body: UpdateMarriageRecordStatusDto,
  ): Promise<MarriageRecordDto> {
    const row = await this.prisma.client.marriageRecord.findUnique({ where: { id: recordId } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('Marriage record not found');
    }
    if (row.status !== MarriageRecordStatus.CONFIRMED) {
      throw new BadRequestException(
        'Only active confirmed marriages can be marked divorced or deceased',
      );
    }
    if (body.status !== 'DIVORCED' && body.status !== 'DECEASED') {
      throw new BadRequestException('Invalid status');
    }

    const marriageDateIso = row.marriageDate ? formatMarriageDateOnly(row.marriageDate) : null;
    const endedCheck = validateStatusEndedDate(marriageDateIso, body.statusEndedDate);
    if (!endedCheck.ok) {
      throw new BadRequestException(endedCheck.message);
    }

    const updated = await this.prisma.client.marriageRecord.update({
      where: { id: recordId },
      data: {
        status:
          body.status === 'DIVORCED'
            ? MarriageRecordStatus.DIVORCED
            : MarriageRecordStatus.DECEASED,
        statusEndedAt: parseMarriageDateInput(endedCheck.normalized),
      },
    });

    await this.marriageConfirmations.refreshHasConfirmedMarriage(userId);
    if (row.linkedPartnerUserId) {
      await this.marriageConfirmations.refreshHasConfirmedMarriage(row.linkedPartnerUserId);
    }

    return marriageRecordToDto(this.crypto, updated);
  }

  async updatePublicPartnerDisplay(
    userId: string,
    showMarriagePartnerOnPublicBiodata: boolean,
  ): Promise<MarriageRecordListDto> {
    await this.ensureUserWithProfile(userId);
    await this.prisma.client.profile.update({
      where: { userId },
      data: { showMarriagePartnerOnPublicBiodata },
    });
    return this.listMine(userId);
  }

  private parseSlotIndex(slotIndex: number): number {
    if (!Number.isInteger(slotIndex) || slotIndex < 1) {
      throw new BadRequestException('Invalid slot index');
    }
    return slotIndex;
  }

  private async assertSlotUnlocked(
    userId: string,
    slotIndex: number,
    gender: Gender,
  ): Promise<void> {
    if (slotIndex === 1) {
      return;
    }
    if (gender !== 'MALE') {
      throw new BadRequestException('Only one marriage slot is available on your profile');
    }
    const prior = await this.prisma.client.marriageRecord.findUnique({
      where: { userId_slotIndex: { userId, slotIndex: slotIndex - 1 } },
    });
    if (!prior || !isMarriageRecordSlotOccupiedForProgression(prior.status)) {
      throw new BadRequestException(
        'Complete or end your previous marriage before adding another slot',
      );
    }
  }

  private async applyChildrenToOtherDraftSlots(
    userId: string,
    sourceSlotIndex: number,
    grouped: Map<number, MarriageRecordChildDto[]>,
  ): Promise<void> {
    for (const [targetSlot, children] of grouped) {
      if (targetSlot === sourceSlotIndex) {
        continue;
      }
      const existing = await this.prisma.client.marriageRecord.findUnique({
        where: { userId_slotIndex: { userId, slotIndex: targetSlot } },
      });
      if (existing && !canUpdateChildrenOnMarriageRecord(existing.status)) {
        throw new BadRequestException(`Cannot assign children to marriage slot ${targetSlot}`);
      }
      const childrenEnc = this.crypto.encryptJson({ items: children }) as Prisma.InputJsonValue;
      if (existing) {
        await this.prisma.client.marriageRecord.update({
          where: { id: existing.id },
          data: { childrenEnc },
        });
      }
    }
  }

  private resolveNextEditableSlot(
    gender: Gender,
    records: MarriageRecordDto[],
    maxSlots: number,
  ): number | null {
    if (maxSlots <= 0) {
      return null;
    }
    const bySlot = new Map(records.map((r) => [r.slotIndex, r]));
    for (let slot = 1; slot <= maxSlots; slot += 1) {
      const record = bySlot.get(slot);
      if (!record) {
        if (slot === 1) {
          return 1;
        }
        const prev = bySlot.get(slot - 1);
        if (isMarriageRecordSlotOccupiedForProgression(prev?.status)) {
          return slot;
        }
        return null;
      }
      if (record.status === 'DRAFT') {
        return slot;
      }
      if (isMarriageRecordSlotOccupiedForProgression(record.status) && slot < maxSlots) {
        continue;
      }
      if (
        gender === 'FEMALE' &&
        slot === 1 &&
        isMarriageRecordSlotOccupiedForProgression(record.status)
      ) {
        return null;
      }
    }
    return null;
  }

  private requireProfile(user: { profile: { gender: Gender } | null }): { gender: Gender } {
    if (!user.profile) {
      throw new ForbiddenException('User not found');
    }
    return user.profile;
  }

  private async ensureUserWithProfile(userId: string) {
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
    if (!user?.profile || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User not found');
    }
    return user;
  }
}
