import { Injectable, NotFoundException } from '@nestjs/common';
import { UserNotificationType } from '@soulsync/db';
import type {
  UserNotificationDto,
  UserNotificationListDto,
} from '@soulsync/shared-types/notifications';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    userId: string,
    cursor?: string,
    limitRaw?: number,
  ): Promise<UserNotificationListDto> {
    await this.requireUser(userId);
    const limit = Math.min(Math.max(limitRaw ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    const parsedCursor = parseNotificationCursor(cursor);

    const rows = await this.prisma.client.userNotification.findMany({
      where: {
        userId,
        ...(parsedCursor
          ? {
              OR: [
                { createdAt: { lt: parsedCursor.createdAt } },
                { createdAt: parsedCursor.createdAt, id: { lt: parsedCursor.id } },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });

    const unreadCount = await this.prisma.client.userNotification.count({
      where: { userId, readAt: null },
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];
    const nextCursor =
      hasMore && last ? encodeNotificationCursor({ createdAt: last.createdAt, id: last.id }) : null;

    return {
      items: page.map(toNotificationDto),
      nextCursor,
      unreadCount,
    };
  }

  async markRead(userId: string, notificationId: string): Promise<UserNotificationDto> {
    await this.requireUser(userId);
    const row = await this.prisma.client.userNotification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!row) {
      throw new NotFoundException('Notification not found');
    }
    if (row.readAt) {
      return toNotificationDto(row);
    }
    const updated = await this.prisma.client.userNotification.update({
      where: { id: row.id },
      data: { readAt: new Date() },
    });
    return toNotificationDto(updated);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    await this.requireUser(userId);
    const result = await this.prisma.client.userNotification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { updated: result.count };
  }

  async createCommunityMentionNotifications(input: {
    tenantId: string;
    actorUserId: string;
    actorUsername: string | null;
    communitySlug: string;
    postId: string;
    commentId?: string;
    mentionedUserIds: string[];
    context: 'post' | 'comment';
  }): Promise<void> {
    const distinct = [...new Set(input.mentionedUserIds)].filter((id) => id !== input.actorUserId);
    if (distinct.length === 0) {
      return;
    }

    const actorLabel = input.actorUsername
      ? `@${input.actorUsername.replace(/^@+/, '')}`
      : 'Someone';
    const linkPath = input.commentId
      ? `/communities/${input.communitySlug}#post-${input.postId}-comment-${input.commentId}`
      : `/communities/${input.communitySlug}#post-${input.postId}`;
    const title = `${actorLabel} mentioned you`;
    const body = input.context === 'comment' ? 'In a community comment' : 'In a community post';

    await this.prisma.client.userNotification.createMany({
      data: distinct.map((userId) => ({
        userId,
        tenantId: input.tenantId,
        type: UserNotificationType.COMMUNITY_MENTION,
        title,
        body,
        linkPath,
      })),
    });
  }

  private async requireUser(userId: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}

function toNotificationDto(row: {
  id: string;
  type: UserNotificationType;
  title: string;
  body: string | null;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
}): UserNotificationDto {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    linkPath: row.linkPath,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

type NotificationCursor = { createdAt: Date; id: string };

function encodeNotificationCursor(cursor: NotificationCursor): string {
  return Buffer.from(
    JSON.stringify({ c: cursor.createdAt.toISOString(), i: cursor.id }),
    'utf8',
  ).toString('base64url');
}

function parseNotificationCursor(raw: string | undefined): NotificationCursor | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      c?: string;
      i?: string;
    };
    if (!parsed.c || !parsed.i) {
      return null;
    }
    const createdAt = new Date(parsed.c);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }
    return { createdAt, id: parsed.i };
  } catch {
    return null;
  }
}
