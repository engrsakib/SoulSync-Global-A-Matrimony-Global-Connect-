import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { MESSENGER_ONLINE_TTL_SECONDS, MESSENGER_REDIS } from './messenger.constants';

@Injectable()
export class MessengerRedisService {
  constructor(private readonly redis: RedisService) {}

  private async client() {
    if (this.redis.client.status === 'wait') {
      await this.redis.client.connect();
    }
    return this.redis.client;
  }

  async registerSocket(userId: string, socketId: string): Promise<void> {
    const c = await this.client();
    const pipe = c.multi();
    pipe.sadd(MESSENGER_REDIS.userSockets(userId), socketId);
    pipe.set(MESSENGER_REDIS.socketUser(socketId), userId, 'EX', MESSENGER_ONLINE_TTL_SECONDS * 2);
    pipe.set(MESSENGER_REDIS.online(userId), '1', 'EX', MESSENGER_ONLINE_TTL_SECONDS);
    await pipe.exec();
  }

  async unregisterSocket(socketId: string): Promise<void> {
    const c = await this.client();
    const userId = await c.get(MESSENGER_REDIS.socketUser(socketId));
    if (!userId) {
      return;
    }
    const pipe = c.multi();
    pipe.srem(MESSENGER_REDIS.userSockets(userId), socketId);
    pipe.del(MESSENGER_REDIS.socketUser(socketId));
    await pipe.exec();
    const remaining = await c.scard(MESSENGER_REDIS.userSockets(userId));
    if (remaining === 0) {
      await c.del(MESSENGER_REDIS.online(userId));
    }
  }

  async touchOnline(userId: string): Promise<void> {
    const c = await this.client();
    await c.set(MESSENGER_REDIS.online(userId), '1', 'EX', MESSENGER_ONLINE_TTL_SECONDS);
  }

  async isOnline(userId: string): Promise<boolean> {
    const c = await this.client();
    const v = await c.get(MESSENGER_REDIS.online(userId));
    return v === '1';
  }

  async incrementUnread(recipientUserId: string, conversationId: string): Promise<void> {
    const c = await this.client();
    await c.hincrby(MESSENGER_REDIS.unread(recipientUserId), conversationId, 1);
  }

  async clearUnread(userId: string, conversationId: string): Promise<void> {
    const c = await this.client();
    await c.hdel(MESSENGER_REDIS.unread(userId), conversationId);
  }

  async getUnreadMap(userId: string): Promise<Record<string, number>> {
    const c = await this.client();
    const raw = await c.hgetall(MESSENGER_REDIS.unread(userId));
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(raw)) {
      const n = Number.parseInt(value, 10);
      if (Number.isFinite(n) && n > 0) {
        out[key] = n;
      }
    }
    return out;
  }

  async totalUnread(userId: string): Promise<number> {
    const map = await this.getUnreadMap(userId);
    return Object.values(map).reduce((sum, n) => sum + n, 0);
  }
}
