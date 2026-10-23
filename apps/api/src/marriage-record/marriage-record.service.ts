import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Gender, MarriageRecordStatus, UserStatus } from '@soulsync/db';
import type {
  ConfirmMarriageRecordDto,
  MarriageRecordDto,
  MarriageRecordListDto,
  UpdateMarriageRecordStatusDto,
  UpsertMarriageRecordDraftDto,
} from '@soulsync/shared-types/marriage-record';
import {
  maxMarriageSlotsForGender,
  spouseRoleForProfileGender,
  validateMarriageRecordForConfirm,
} from '@soulsync/shared-types/marriage-record';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarriageConfirmationService } from '../marriage-confirmation/marriage-confirmation.service';
import {
  buildDraftEncryptedFields,
  buildEncryptedMarriageRecordFields,
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

    const rows = await this.prisma.client.marriageRecord.findMany({
      where: { userId },
      orderBy: { slotIndex: 'asc' },
    });

    const records = rows.map((row) => marriageRecordToDto(this.crypto, row));
    return {
      viewerUserId: userId,
      gender,
      maxSlots,
      showMarriagePartnerOnPublicBiodata,
      records,
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

    const row = await this.prisma.client.marriageRecord.upsert({
      where: { userId_slotIndex: { userId, slotIndex } },
      create: {
        tenantId: user.tenantId,
        userId,
        slotIndex,
        spouseRole: spouseRoleForProfileGender(gender),
        status: MarriageRecordStatus.DRAFT,
        partnerUsernameHint: partnerUsername,
        ...encrypted,
      },
      update: {
        partnerUsernameHint: partnerUsername,
        ...encrypted,
      },
    });

    return marriageRecordToDto(this.crypto, row);
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
    const validation = validateMarriageRecordForConfirm({
      spouseName: draftDto.spouseName ?? undefined,
      marriageDate: draftDto.marriageDate ?? undefined,
      spousePhone: draftDto.spousePhone ?? undefined,
      spouseTelegram: draftDto.spouseTelegram ?? undefined,
      spouseWhatsApp: draftDto.spouseWhatsApp ?? undefined,
      partnerUsername: draftDto.partnerUsername ?? undefined,
      children: draftDto.children,
    });
    if (!validation.ok) {
      throw new BadRequestException(validation.message);
    }

    const confirmedCount = await this.countActiveConfirmed(userId);
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

    const updated = await this.prisma.client.marriageRecord.update({
      where: { id: recordId },
      data: {
        status:
          body.status === 'DIVORCED'
            ? MarriageRecordStatus.DIVORCED
            : MarriageRecordStatus.DECEASED,
      },
    });
    return marriageRecordToDto(this.crypto, updated);
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
    if (!prior || prior.status !== MarriageRecordStatus.CONFIRMED) {
      throw new BadRequestException('Confirm your previous marriage before adding another slot');
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
        if (prev?.status === 'CONFIRMED') {
          return slot;
        }
        return null;
      }
      if (record.status === 'DRAFT') {
        return slot;
      }
    }
    return null;
  }

  private async countActiveConfirmed(userId: string): Promise<number> {
    return this.prisma.client.marriageRecord.count({
      where: { userId, status: MarriageRecordStatus.CONFIRMED },
    });
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
