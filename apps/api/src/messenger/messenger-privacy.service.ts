import { Injectable } from '@nestjs/common';
import { MessengerPrivacyAction } from '@soulsync/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessengerPrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async isBlockedEitherDirection(userA: string, userB: string): Promise<boolean> {
    const row = await this.prisma.client.messengerPrivacy.findFirst({
      where: {
        action: MessengerPrivacyAction.BLOCK,
        OR: [
          { ownerId: userA, targetId: userB },
          { ownerId: userB, targetId: userA },
        ],
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async isRestrictedFromSenderToRecipient(senderId: string, recipientId: string): Promise<boolean> {
    const row = await this.prisma.client.messengerPrivacy.findFirst({
      where: {
        ownerId: recipientId,
        targetId: senderId,
        action: MessengerPrivacyAction.RESTRICT,
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async assertMessagingAllowed(senderId: string, recipientId: string): Promise<void> {
    if (await this.isBlockedEitherDirection(senderId, recipientId)) {
      throw new Error('BLOCKED');
    }
  }
}
