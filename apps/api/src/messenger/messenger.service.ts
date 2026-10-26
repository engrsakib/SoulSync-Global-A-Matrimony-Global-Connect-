import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MessengerParticipantFolder,
  UserNotificationType,
  type Prisma,
} from '@soulsync/db';
import type {
  CreateMessengerConversationRequestDto,
  MessengerConversationListDto,
  MessengerKeyBundleDto,
  MessengerMessagesPageDto,
  MessengerPeerIdentityReportRequestDto,
  MessengerPrivacyRequestDto,
  PublishMessengerKeysRequestDto,
} from '@soulsync/shared-types/messenger';
import { identityKeyFingerprint } from '@soulsync/shared-types/messenger-safety-number';
import { isMessengerReactionEmoji } from '@soulsync/shared-types/messenger';
import { JwtTokenService } from '../auth/jwt.service';
import type { JwtPayload } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { resolveEditorGrantMemberLabel } from '../biodata-editor/biodata-editor-member-label';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { MessengerLinkPreviewService } from './messenger-link-preview.service';
import { MessengerPrivacyService } from './messenger-privacy.service';
import { MessengerRedisService } from './messenger-redis.service';
import { toConversationDto, toMessageDto, toPeerSummary } from './messenger.mapper';

type PeerUserRow = {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  profile: { displayName: string | null } | null;
};

@Injectable()
export class MessengerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: MessengerRedisService,
    private readonly privacy: MessengerPrivacyService,
    private readonly linkPreview: MessengerLinkPreviewService,
    private readonly jwt: JwtTokenService,
    private readonly fieldCrypto: FieldEncryptionService,
  ) {}

  private resolvePeerDisplayName(peer: PeerUserRow | null | undefined): string | null {
    if (!peer) {
      return null;
    }
    return resolveEditorGrantMemberLabel(
      {
        username: peer.username,
        firstName: peer.firstName,
        lastName: peer.lastName,
        profileDisplayName: peer.profile?.displayName ?? null,
      },
      (stored) => this.fieldCrypto.decryptString(stored),
    );
  }

  createSocketTicket(payload: JwtPayload): { ticket: string; expiresInSeconds: number } {
    if (!payload.sid?.trim()) {
      throw new ForbiddenException('Missing session');
    }
    const ticket = this.jwt.signSocket({
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      sid: payload.sid,
    });
    return { ticket, expiresInSeconds: 120 };
  }

  async publishKeys(userId: string, tenantId: string, body: PublishMessengerKeysRequestDto): Promise<void> {
    await this.prisma.client.messengerKeyBundle.upsert({
      where: { userId },
      create: {
        userId,
        tenantId,
        identityPublicKey: body.identityPublicKey,
        signedPreKeyPublic: body.signedPreKeyPublic,
        signedPreKeySignature: body.signedPreKeySignature,
        signedPreKeyId: body.signedPreKeyId,
      },
      update: {
        identityPublicKey: body.identityPublicKey,
        signedPreKeyPublic: body.signedPreKeyPublic,
        signedPreKeySignature: body.signedPreKeySignature,
        signedPreKeyId: body.signedPreKeyId,
      },
    });
    await this.prisma.client.messengerOneTimePrekey.deleteMany({ where: { userId } });
    if (body.oneTimePrekeys.length > 0) {
      await this.prisma.client.messengerOneTimePrekey.createMany({
        data: body.oneTimePrekeys.map((p) => ({
          userId,
          keyId: p.keyId,
          publicKey: p.publicKey,
        })),
      });
    }
  }

  async getKeyBundle(peerUserId: string, tenantId: string): Promise<MessengerKeyBundleDto> {
    const bundle = await this.prisma.client.messengerKeyBundle.findFirst({
      where: { userId: peerUserId, tenantId },
      include: {
        oneTimePrekeys: {
          where: { consumedAt: null },
          take: 1,
          orderBy: { keyId: 'asc' },
        },
      },
    });
    if (!bundle) {
      throw new NotFoundException('Key bundle not found');
    }
    return {
      userId: bundle.userId,
      identityPublicKey: bundle.identityPublicKey,
      signedPreKeyPublic: bundle.signedPreKeyPublic,
      signedPreKeySignature: bundle.signedPreKeySignature,
      signedPreKeyId: bundle.signedPreKeyId,
      oneTimePrekeys: bundle.oneTimePrekeys.map((p) => ({ keyId: p.keyId, publicKey: p.publicKey })),
    };
  }

  async listConversations(userId: string, tenantId: string): Promise<MessengerConversationListDto> {
    const participants = await this.prisma.client.messengerParticipant.findMany({
      where: { userId, conversation: { tenantId } },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { reactions: true },
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    profile: { select: { displayName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const unreadMap = await this.redis.getUnreadMap(userId);
    const items = await Promise.all(
      participants.map(async (part) => {
        const peerPart = part.conversation.participants.find((p) => p.userId !== userId);
        const peerUser = peerPart?.user as PeerUserRow | undefined;
        const lastRow = part.conversation.messages[0];
        const isOnline = peerUser ? await this.redis.isOnline(peerUser.id) : false;
        return toConversationDto({
          id: part.conversationId,
          folder: part.folder,
          peer: toPeerSummary({
            userId: peerUser?.id ?? '',
            username: peerUser?.username ?? null,
            displayName: this.resolvePeerDisplayName(peerUser),
            avatarUrl: peerUser?.avatarUrl ?? null,
            isOnline,
          }),
          peerIdentityFingerprint: part.peerIdentityFingerprint ?? null,
          lastMessage: lastRow ? toMessageDto({ ...lastRow, reactions: lastRow.reactions }) : null,
          unreadCount: unreadMap[part.conversationId] ?? 0,
          updatedAt: part.conversation.updatedAt,
        });
      }),
    );
    const totalUnread = await this.redis.totalUnread(userId);
    return { items, totalUnread };
  }

  async createConversation(
    userId: string,
    tenantId: string,
    body: CreateMessengerConversationRequestDto,
  ) {
    const username = body.username.trim().toLowerCase().replace(/^@+/, '');
    const peer = await this.prisma.client.user.findFirst({
      where: { tenantId, username, deletedAt: null },
      select: { id: true },
    });
    if (!peer) {
      throw new NotFoundException('Member not found');
    }
    if (peer.id === userId) {
      throw new BadRequestException('Cannot message yourself');
    }
    if (await this.privacy.isBlockedEitherDirection(userId, peer.id)) {
      throw new ForbiddenException('Messaging is blocked');
    }
    const [low, high] = userId.localeCompare(peer.id) <= 0 ? [userId, peer.id] : [peer.id, userId];
    let conversation = await this.prisma.client.messengerConversation.findUnique({
      where: { tenantId_participantLowId_participantHighId: { tenantId, participantLowId: low, participantHighId: high } },
    });
    if (!conversation) {
      const peerRestricted = await this.privacy.isRestrictedFromSenderToRecipient(userId, peer.id);
      conversation = await this.prisma.client.messengerConversation.create({
        data: {
          tenantId,
          participantLowId: low,
          participantHighId: high,
          participants: {
            create: [
              { userId },
              {
                userId: peer.id,
                folder: peerRestricted
                  ? MessengerParticipantFolder.REQUESTS
                  : MessengerParticipantFolder.INBOX,
              },
            ],
          },
        },
      });
    }
    const list = await this.listConversations(userId, tenantId);
    const item = list.items.find((c) => c.id === conversation.id);
    if (!item) {
      throw new NotFoundException('Conversation not found');
    }
    return item;
  }

  async getMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    limitRaw = 40,
  ): Promise<MessengerMessagesPageDto> {
    await this.requireParticipant(userId, conversationId);
    const limit = Math.min(Math.max(limitRaw, 1), 80);
    const rows = await this.prisma.client.messengerMessage.findMany({
      where: {
        conversationId,
        ...(cursor ? { id: { lt: cursor } } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: { reactions: true },
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore && page.length > 0 ? page[page.length - 1]!.id : null;
    return {
      items: page.reverse().map((r) => toMessageDto(r)),
      nextCursor,
    };
  }

  async acceptRequest(userId: string, conversationId: string): Promise<void> {
    const part = await this.requireParticipant(userId, conversationId);
    if (part.folder !== MessengerParticipantFolder.REQUESTS) {
      return;
    }
    await this.prisma.client.messengerParticipant.update({
      where: { id: part.id },
      data: { folder: MessengerParticipantFolder.INBOX },
    });
  }

  async setPrivacy(
    userId: string,
    tenantId: string,
    body: MessengerPrivacyRequestDto,
  ): Promise<void> {
    if (body.targetUserId === userId) {
      throw new BadRequestException('Invalid target');
    }
    if (body.action === null) {
      await this.prisma.client.messengerPrivacy.deleteMany({
        where: { ownerId: userId, targetId: body.targetUserId },
      });
      return;
    }
    await this.prisma.client.messengerPrivacy.upsert({
      where: { ownerId_targetId: { ownerId: userId, targetId: body.targetUserId } },
      create: {
        tenantId,
        ownerId: userId,
        targetId: body.targetUserId,
        action: body.action,
      },
      update: { action: body.action },
    });
  }

  async reportPeerIdentity(
    userId: string,
    tenantId: string,
    body: MessengerPeerIdentityReportRequestDto,
  ): Promise<{ changed: boolean }> {
    const part = await this.prisma.client.messengerParticipant.findFirst({
      where: {
        userId,
        conversation: {
          tenantId,
          participants: { some: { userId: body.peerUserId } },
        },
      },
    });
    if (!part) {
      throw new NotFoundException('Conversation not found');
    }
    const previous = part.peerIdentityFingerprint;
    const changed = Boolean(previous && previous !== body.identityFingerprint);
    await this.prisma.client.messengerParticipant.update({
      where: { id: part.id },
      data: { peerIdentityFingerprint: body.identityFingerprint },
    });
    if (changed) {
      await this.prisma.client.userNotification.create({
        data: {
          userId,
          tenantId,
          type: UserNotificationType.MESSENGER_SECURITY_CODE_CHANGED,
          title: 'Security code changed',
          body: 'Verify your safety number with this contact in Messenger.',
          linkPath: '/dashboard/messenger',
        },
      });
    }
    return { changed };
  }

  getLinkPreview(url: string) {
    return this.linkPreview.fetchPreview(url);
  }

  async handleSendMessage(
    senderId: string,
    input: {
      conversationId: string;
      ciphertext: string;
      nonce: string;
      header?: Record<string, unknown>;
    },
  ) {
    const part = await this.requireParticipant(senderId, input.conversationId);
    const recipient = await this.prisma.client.messengerParticipant.findFirst({
      where: { conversationId: input.conversationId, userId: { not: senderId } },
      select: { userId: true, folder: true },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }
    if (await this.privacy.isBlockedEitherDirection(senderId, recipient.userId)) {
      throw new ForbiddenException('Messaging is blocked');
    }
    const restricted = await this.privacy.isRestrictedFromSenderToRecipient(senderId, recipient.userId);
    if (restricted && recipient.folder === MessengerParticipantFolder.INBOX) {
      await this.prisma.client.messengerParticipant.updateMany({
        where: { conversationId: input.conversationId, userId: recipient.userId },
        data: { folder: MessengerParticipantFolder.REQUESTS },
      });
    }

    const header = (input.header ?? {}) as Prisma.InputJsonValue;
    const message = await this.prisma.client.messengerMessage.create({
      data: {
        conversationId: input.conversationId,
        senderId,
        ciphertext: input.ciphertext,
        nonce: input.nonce,
        header,
      },
      include: { reactions: true },
    });
    await this.prisma.client.messengerConversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    });
    await this.prisma.client.messengerParticipant.update({
      where: { id: part.id },
      data: { updatedAt: new Date() },
    });
    try {
      await this.redis.incrementUnread(recipient.userId, input.conversationId);
    } catch {
      /* message persisted; unread badge may lag if Redis is down */
    }
    return toMessageDto(message);
  }

  async handleEditMessage(
    senderId: string,
    input: { messageId: string; ciphertext: string; nonce: string; header?: Record<string, unknown> },
  ) {
    const message = await this.prisma.client.messengerMessage.findUnique({
      where: { id: input.messageId },
      include: { reactions: true },
    });
    if (!message || message.senderId !== senderId) {
      throw new ForbiddenException('Cannot edit message');
    }
    if (message.unsentAt) {
      throw new BadRequestException('Message was unsent');
    }
    await this.requireParticipant(senderId, message.conversationId);
    const updated = await this.prisma.client.messengerMessage.update({
      where: { id: message.id },
      data: {
        ciphertext: input.ciphertext,
        nonce: input.nonce,
        header: (input.header ?? {}) as Prisma.InputJsonValue,
        version: { increment: 1 },
        editedAt: new Date(),
      },
      include: { reactions: true },
    });
    return toMessageDto(updated);
  }

  async handleUnsend(senderId: string, messageId: string) {
    const message = await this.prisma.client.messengerMessage.findUnique({ where: { id: messageId } });
    if (!message || message.senderId !== senderId) {
      throw new ForbiddenException('Cannot unsend message');
    }
    await this.requireParticipant(senderId, message.conversationId);
    const updated = await this.prisma.client.messengerMessage.update({
      where: { id: messageId },
      data: { unsentAt: new Date(), ciphertext: '', nonce: '' },
      include: { reactions: true },
    });
    return toMessageDto(updated);
  }

  async handleReact(userId: string, messageId: string, emoji: string | null) {
    const message = await this.prisma.client.messengerMessage.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }
    await this.requireParticipant(userId, message.conversationId);
    if (emoji === null) {
      await this.prisma.client.messengerReaction.deleteMany({ where: { messageId, userId } });
    } else {
      if (!isMessengerReactionEmoji(emoji)) {
        throw new BadRequestException('Invalid reaction');
      }
      await this.prisma.client.messengerReaction.upsert({
        where: { messageId_userId: { messageId, userId } },
        create: { messageId, userId, emoji },
        update: { emoji },
      });
    }
    const fresh = await this.prisma.client.messengerMessage.findUnique({
      where: { id: messageId },
      include: { reactions: true },
    });
    if (!fresh) {
      throw new NotFoundException('Message not found');
    }
    return toMessageDto(fresh);
  }

  async handleRead(userId: string, conversationId: string, lastReadMessageId: string) {
    const part = await this.requireParticipant(userId, conversationId);
    await this.prisma.client.messengerParticipant.update({
      where: { id: part.id },
      data: { lastReadMessageId },
    });
    await this.redis.clearUnread(userId, conversationId);
    return { ok: true as const };
  }

  async consumeOneTimePrekey(peerUserId: string, keyId: number): Promise<void> {
    await this.prisma.client.messengerOneTimePrekey.updateMany({
      where: { userId: peerUserId, keyId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  fingerprintFromIdentityKey(identityPublicKey: string): string {
    return identityKeyFingerprint(identityPublicKey);
  }

  async assertConversationParticipant(userId: string, conversationId: string): Promise<void> {
    await this.requireParticipant(userId, conversationId);
  }

  private async requireParticipant(userId: string, conversationId: string) {
    const part = await this.prisma.client.messengerParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!part) {
      throw new ForbiddenException('Not a participant');
    }
    return part;
  }
}
