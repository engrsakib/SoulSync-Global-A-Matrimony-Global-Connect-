import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessengerScheduledMessageStatus } from '@soulsync/db';
import type { MessengerScheduledMessageDto } from '@soulsync/shared-types/messenger';
import type { Env } from '../config/env.schema';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessengerGateway } from './messenger.gateway';
import { MessengerScheduleQueueService } from './messenger-schedule-queue.service';
import { MESSENGER_SCHEDULE_MAX_ATTEMPTS } from './messenger-schedule.constants';
import { MessengerService } from './messenger.service';

@Injectable()
export class MessengerScheduledService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldCrypto: FieldEncryptionService,
    private readonly queue: MessengerScheduleQueueService,
    private readonly gateway: MessengerGateway,
    private readonly messenger: MessengerService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private toDto(row: {
    id: string;
    conversationId: string;
    senderId: string;
    scheduledAt: Date;
    status: MessengerScheduledMessageStatus;
    draftPlaintextEnc: string;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }, plaintext: string | null): MessengerScheduledMessageDto {
    return {
      id: row.id,
      conversationId: row.conversationId,
      senderId: row.senderId,
      scheduledAt: row.scheduledAt.toISOString(),
      status: row.status,
      plaintextPreview: plaintext ? truncatePreview(plaintext) : null,
      lastError: row.lastError,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private assertScheduledAt(scheduledAt: Date): void {
    const maxDays = this.config.get('MESSENGER_SCHEDULE_MAX_DAYS', { infer: true });
    const maxMs = maxDays * 24 * 60 * 60 * 1000;
    const when = scheduledAt.getTime();
    const now = Date.now();
    if (when <= now + 30_000) {
      throw new BadRequestException('Scheduled time must be in the future');
    }
    if (when > now + maxMs) {
      throw new BadRequestException(`Scheduled time must be within ${maxDays} days`);
    }
  }

  async listForConversation(
    userId: string,
    tenantId: string,
    conversationId: string,
  ): Promise<MessengerScheduledMessageDto[]> {
    await this.messenger.assertConversationParticipant(userId, conversationId);
    const rows = await this.prisma.client.messengerScheduledMessage.findMany({
      where: {
        conversationId,
        senderId: userId,
        tenantId,
        status: MessengerScheduledMessageStatus.SCHEDULED,
      },
      orderBy: { scheduledAt: 'asc' },
    });
    return rows.map((row) =>
      this.toDto(row, this.fieldCrypto.decryptString(row.draftPlaintextEnc)),
    );
  }

  async getForSender(
    userId: string,
    tenantId: string,
    scheduleId: string,
  ): Promise<MessengerScheduledMessageDto & { plaintext: string | null }> {
    const row = await this.prisma.client.messengerScheduledMessage.findFirst({
      where: { id: scheduleId, senderId: userId, tenantId },
    });
    if (!row) {
      throw new NotFoundException('Scheduled message not found');
    }
    const plaintext = this.fieldCrypto.decryptString(row.draftPlaintextEnc);
    return { ...this.toDto(row, plaintext), plaintext };
  }

  async create(
    userId: string,
    tenantId: string,
    conversationId: string,
    body: { scheduledAt: string; plaintext: string },
  ): Promise<MessengerScheduledMessageDto> {
    await this.messenger.assertConversationParticipant(userId, conversationId);
    const plain = body.plaintext.trim();
    if (!plain) {
      throw new BadRequestException('Message cannot be empty');
    }
    const scheduledAt = new Date(body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduled time');
    }
    this.assertScheduledAt(scheduledAt);
    const enc = this.fieldCrypto.encryptString(plain);
    if (!enc) {
      throw new BadRequestException('Could not encrypt draft');
    }
    const row = await this.prisma.client.messengerScheduledMessage.create({
      data: {
        tenantId,
        conversationId,
        senderId: userId,
        scheduledAt,
        draftPlaintextEnc: enc,
      },
    });
    const jobId = await this.queue.enqueueDeliver(row.id, scheduledAt);
    const updated = await this.prisma.client.messengerScheduledMessage.update({
      where: { id: row.id },
      data: { jobId },
    });
    return this.toDto(updated, plain);
  }

  async update(
    userId: string,
    tenantId: string,
    scheduleId: string,
    body: { scheduledAt?: string; plaintext?: string },
  ): Promise<MessengerScheduledMessageDto> {
    const row = await this.prisma.client.messengerScheduledMessage.findFirst({
      where: { id: scheduleId, senderId: userId, tenantId },
    });
    if (!row || row.status !== MessengerScheduledMessageStatus.SCHEDULED) {
      throw new NotFoundException('Scheduled message not found');
    }
    let scheduledAt = row.scheduledAt;
    if (body.scheduledAt) {
      scheduledAt = new Date(body.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new BadRequestException('Invalid scheduled time');
      }
      this.assertScheduledAt(scheduledAt);
    }
    const enc =
      body.plaintext !== undefined
        ? this.fieldCrypto.encryptString(body.plaintext.trim())
        : row.draftPlaintextEnc;
    if (body.plaintext !== undefined && !enc) {
      throw new BadRequestException('Message cannot be empty');
    }
    await this.queue.removeJob(row.id);
    const jobId = await this.queue.enqueueDeliver(row.id, scheduledAt);
    const updated = await this.prisma.client.messengerScheduledMessage.update({
      where: { id: row.id },
      data: {
        scheduledAt,
        draftPlaintextEnc: enc ?? row.draftPlaintextEnc,
        jobId,
        lastError: null,
      },
    });
    const plain = this.fieldCrypto.decryptString(updated.draftPlaintextEnc);
    return this.toDto(updated, plain);
  }

  async cancel(userId: string, tenantId: string, scheduleId: string): Promise<void> {
    const row = await this.prisma.client.messengerScheduledMessage.findFirst({
      where: { id: scheduleId, senderId: userId, tenantId },
    });
    if (!row || row.status !== MessengerScheduledMessageStatus.SCHEDULED) {
      throw new NotFoundException('Scheduled message not found');
    }
    await this.queue.removeJob(row.id);
    await this.prisma.client.messengerScheduledMessage.update({
      where: { id: row.id },
      data: { status: MessengerScheduledMessageStatus.CANCELLED },
    });
  }

  async markSent(userId: string, tenantId: string, scheduleId: string): Promise<void> {
    const row = await this.prisma.client.messengerScheduledMessage.findFirst({
      where: { id: scheduleId, senderId: userId, tenantId },
    });
    if (!row) {
      throw new NotFoundException('Scheduled message not found');
    }
    if (row.senderId !== userId) {
      throw new ForbiddenException('Not allowed');
    }
    await this.prisma.client.messengerScheduledMessage.update({
      where: { id: row.id },
      data: {
        status: MessengerScheduledMessageStatus.SENT,
        draftPlaintextEnc: '',
        lastError: null,
      },
    });
  }

  async deliverDueSchedule(scheduleId: string): Promise<void> {
    const row = await this.prisma.client.messengerScheduledMessage.findUnique({
      where: { id: scheduleId },
    });
    if (!row || row.status !== MessengerScheduledMessageStatus.SCHEDULED) {
      return;
    }
    if (row.scheduledAt.getTime() > Date.now() + 5000) {
      return;
    }
    this.gateway.emitScheduleDeliver(row.senderId, {
      scheduleId: row.id,
      conversationId: row.conversationId,
    });
  }

  async recordDeliveryFailure(scheduleId: string, error: string): Promise<void> {
    const row = await this.prisma.client.messengerScheduledMessage.findUnique({
      where: { id: scheduleId },
    });
    if (!row || row.status !== MessengerScheduledMessageStatus.SCHEDULED) {
      return;
    }
    await this.prisma.client.messengerScheduledMessage.update({
      where: { id: row.id },
      data: { lastError: error.slice(0, 500) },
    });
  }

  async markFailedAfterAttempts(scheduleId: string): Promise<void> {
    await this.prisma.client.messengerScheduledMessage.updateMany({
      where: { id: scheduleId, status: MessengerScheduledMessageStatus.SCHEDULED },
      data: {
        status: MessengerScheduledMessageStatus.FAILED,
        lastError: `Delivery failed after ${MESSENGER_SCHEDULE_MAX_ATTEMPTS} attempts`,
      },
    });
  }
}

function truncatePreview(text: string, max = 80): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}
