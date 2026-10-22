import { BadRequestException, Injectable } from '@nestjs/common';
import { CommunityMemberStatus } from '@soulsync/db';
import { parseCommunityMentionUsernames } from '@soulsync/shared-types/communities';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommunityMentionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async assertMentionsInCommunity(communityId: string, text: string): Promise<void> {
    const usernames = parseCommunityMentionUsernames(text);
    if (usernames.length === 0) {
      return;
    }
    await this.resolveMemberUserIds(communityId, usernames);
  }

  async notifyPostMentions(input: {
    communityId: string;
    tenantId: string;
    communitySlug: string;
    postId: string;
    actorUserId: string;
    actorUsername: string | null;
    bodyText: string;
    previousBodyText?: string | null;
  }): Promise<void> {
    const mentionedUserIds = await this.newMentionUserIds(
      input.communityId,
      input.bodyText,
      input.previousBodyText,
    );
    if (mentionedUserIds.length === 0) {
      return;
    }
    await this.notifications.createCommunityMentionNotifications({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      communitySlug: input.communitySlug,
      postId: input.postId,
      mentionedUserIds,
      context: 'post',
    });
  }

  async notifyCommentMentions(input: {
    communityId: string;
    tenantId: string;
    communitySlug: string;
    postId: string;
    commentId: string;
    actorUserId: string;
    actorUsername: string | null;
    bodyText: string;
    previousBodyText?: string | null;
  }): Promise<void> {
    const mentionedUserIds = await this.newMentionUserIds(
      input.communityId,
      input.bodyText,
      input.previousBodyText,
    );
    if (mentionedUserIds.length === 0) {
      return;
    }
    await this.notifications.createCommunityMentionNotifications({
      tenantId: input.tenantId,
      actorUserId: input.actorUserId,
      actorUsername: input.actorUsername,
      communitySlug: input.communitySlug,
      postId: input.postId,
      commentId: input.commentId,
      mentionedUserIds,
      context: 'comment',
    });
  }

  private async newMentionUserIds(
    communityId: string,
    bodyText: string,
    previousBodyText?: string | null,
  ): Promise<string[]> {
    const nextNames = parseCommunityMentionUsernames(bodyText);
    if (nextNames.length === 0) {
      return [];
    }
    const prevSet = new Set(parseCommunityMentionUsernames(previousBodyText ?? ''));
    const freshNames = nextNames.filter((name) => !prevSet.has(name));
    if (freshNames.length === 0) {
      return [];
    }
    const resolved = await this.resolveMemberUserIds(communityId, freshNames);
    return freshNames.map((name) => resolved.get(name)!).filter(Boolean);
  }

  private async resolveMemberUserIds(
    communityId: string,
    usernames: string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(usernames.map((u) => u.toLowerCase()))];
    const rows = await this.prisma.client.communityMember.findMany({
      where: {
        communityId,
        status: CommunityMemberStatus.ACTIVE,
        OR: unique.map((username) => ({
          user: { username: { equals: username, mode: 'insensitive' as const } },
        })),
      },
      select: { user: { select: { id: true, username: true } } },
    });

    const byLower = new Map<string, string>();
    for (const row of rows) {
      const name = row.user.username?.trim().toLowerCase();
      if (name) {
        byLower.set(name, row.user.id);
      }
    }

    const missing = unique.filter((u) => !byLower.has(u));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Unknown community members: ${missing.map((u) => `@${u}`).join(', ')}`,
      );
    }

    return byLower;
  }
}
