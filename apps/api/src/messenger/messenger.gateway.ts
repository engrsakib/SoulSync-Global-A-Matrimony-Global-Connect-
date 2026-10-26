import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import { JwtTokenService } from '../auth/jwt.service';
import { AuthSessionService } from '../auth/auth-session.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus } from '@soulsync/db';
import { MessengerRedisService } from './messenger-redis.service';
import { MessengerService } from './messenger.service';
import type { MessengerMessageDto } from '@soulsync/shared-types/messenger';
import { MESSENGER_SOCKET_NAMESPACE } from './messenger.constants';

type MessengerSocketData = {
  userId?: string;
  tenantId?: string;
};

function readSocketData(client: Socket): MessengerSocketData {
  const raw: unknown = client.data;
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const record = raw as Record<string, unknown>;
  return {
    userId: typeof record.userId === 'string' ? record.userId : undefined,
    tenantId: typeof record.tenantId === 'string' ? record.tenantId : undefined,
  };
}

function writeSocketData(client: Socket, patch: MessengerSocketData): void {
  const current = readSocketData(client);
  client.data = { ...current, ...patch };
}

function socketAuth(client: Socket): { userId: string; tenantId: string } | null {
  const { userId, tenantId } = readSocketData(client);
  if (!userId || !tenantId) {
    return null;
  }
  return { userId, tenantId };
}

@WebSocketGateway({
  namespace: MESSENGER_SOCKET_NAMESPACE,
  cors: { origin: true, credentials: true },
})
export class MessengerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessengerGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtTokenService,
    private readonly authSession: AuthSessionService,
    private readonly prisma: PrismaService,
    private readonly messenger: MessengerService,
    private readonly redis: MessengerRedisService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (typeof client.handshake.query.token === 'string' ? client.handshake.query.token : undefined);
      if (!token?.trim()) {
        client.disconnect(true);
        return;
      }
      const payload = this.jwt.verifySocket(token);
      if (!payload.sid?.trim()) {
        client.disconnect(true);
        return;
      }
      const user = await this.prisma.client.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, status: true, deletedAt: true, tenantId: true },
      });
      if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
        client.disconnect(true);
        return;
      }
      await this.authSession.assertAccessSessionActive(payload.sid, user.id);
      writeSocketData(client, { userId: user.id, tenantId: user.tenantId });
      await client.join(`user:${user.id}`);
      await this.redis.registerSocket(user.id, client.id);
    } catch (error) {
      this.logger.debug(`Socket auth failed: ${error instanceof Error ? error.message : 'unknown'}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    await this.redis.unregisterSocket(client.id);
  }

  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string },
  ) {
    const auth = socketAuth(client);
    if (!auth || !body?.conversationId) {
      return { ok: false };
    }
    try {
      await this.messenger.assertConversationParticipant(auth.userId, body.conversationId);
      await client.join(`conv:${body.conversationId}`);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  @SubscribeMessage('message:send')
  async onSend(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: {
      conversationId: string;
      ciphertext: string;
      nonce: string;
      header?: Record<string, unknown>;
    },
  ) {
    const auth = socketAuth(client);
    if (!auth) {
      return { error: 'UNAUTHORIZED' };
    }
    if (!body?.conversationId?.trim() || !body.ciphertext?.trim() || !body.nonce?.trim()) {
      return { error: 'INVALID_PAYLOAD' };
    }
    try {
      const message = await this.messenger.handleSendMessage(auth.userId, body);
      this.server.to(`conv:${body.conversationId}`).emit('message:new', message);
      const recipientPart = await this.prisma.client.messengerParticipant.findFirst({
        where: { conversationId: body.conversationId, userId: { not: auth.userId } },
        select: { userId: true },
      });
      if (recipientPart) {
        this.server.to(`user:${recipientPart.userId}`).emit('message:new', message);
        this.server.to(`user:${recipientPart.userId}`).emit('conversation:updated', {
          conversationId: body.conversationId,
        });
      }
      return { message };
    } catch (error) {
      this.logger.warn(
        `message:send failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return { error: 'SEND_FAILED' };
    }
  }

  @SubscribeMessage('message:edit')
  async onEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    body: { messageId: string; ciphertext: string; nonce: string; header?: Record<string, unknown> },
  ) {
    const auth = socketAuth(client);
    if (!auth) {
      return { error: 'UNAUTHORIZED' };
    }
    if (!body?.messageId?.trim() || !body.ciphertext?.trim() || !body.nonce?.trim()) {
      return { error: 'INVALID_PAYLOAD' };
    }
    try {
      const message = await this.messenger.handleEditMessage(auth.userId, body);
      await this.broadcastMessageUpdated(message);
      return { message };
    } catch (error) {
      this.logger.warn(
        `message:edit failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return { error: 'EDIT_FAILED' };
    }
  }

  @SubscribeMessage('message:unsend')
  async onUnsend(@ConnectedSocket() client: Socket, @MessageBody() body: { messageId: string }) {
    const auth = socketAuth(client);
    if (!auth) {
      return { error: 'UNAUTHORIZED' };
    }
    const message = await this.messenger.handleUnsend(auth.userId, body.messageId);
    await this.broadcastMessageUpdated(message);
    return { message };
  }

  @SubscribeMessage('message:react')
  async onReact(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { messageId: string; emoji: string | null },
  ) {
    const auth = socketAuth(client);
    if (!auth) {
      return { error: 'UNAUTHORIZED' };
    }
    const message = await this.messenger.handleReact(auth.userId, body.messageId, body.emoji);
    await this.broadcastMessageUpdated(message);
    return { message };
  }

  @SubscribeMessage('message:read')
  async onRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId: string; lastReadMessageId: string },
  ) {
    const auth = socketAuth(client);
    if (!auth) {
      return { error: 'UNAUTHORIZED' };
    }
    await this.messenger.handleRead(auth.userId, body.conversationId, body.lastReadMessageId);
    return { ok: true };
  }

  @SubscribeMessage('safety:changed')
  emitSafetyChanged(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { peerUserId: string; identityFingerprint: string },
  ) {
    const auth = socketAuth(client);
    if (!auth) {
      return { ok: false };
    }
    void this.messenger
      .reportPeerIdentity(auth.userId, auth.tenantId, {
        peerUserId: body.peerUserId,
        identityFingerprint: body.identityFingerprint,
      })
      .then((result) => {
        if (result.changed) {
          client.emit('safety:notify', body);
        }
      });
    return { ok: true };
  }

  emitScheduleDeliver(userId: string, payload: { scheduleId: string; conversationId: string }): void {
    this.server.to(`user:${userId}`).emit('schedule:deliver', payload);
  }

  private async broadcastMessageUpdated(message: MessengerMessageDto): Promise<void> {
    this.server.to(`conv:${message.conversationId}`).emit('message:updated', message);
    const participants = await this.prisma.client.messengerParticipant.findMany({
      where: { conversationId: message.conversationId },
      select: { userId: true },
    });
    for (const part of participants) {
      this.server.to(`user:${part.userId}`).emit('message:updated', message);
    }
  }
}
