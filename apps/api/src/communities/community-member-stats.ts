import { CommunityMemberStatus, type PrismaClient } from '@soulsync/db';
import type { CommunityAuthorDto } from '@soulsync/shared-types/communities';
import { toAuthor } from './community.mapper';

const MEMBER_AVATAR_PREVIEW_LIMIT = 8;

export async function loadCommunityMemberStats(
  prisma: PrismaClient,
  communityId: string,
): Promise<{ activeMemberCount: number; memberAvatarPreview: CommunityAuthorDto[] }> {
  const [activeMemberCount, previewRows] = await Promise.all([
    prisma.communityMember.count({
      where: { communityId, status: CommunityMemberStatus.ACTIVE },
    }),
    prisma.communityMember.findMany({
      where: { communityId, status: CommunityMemberStatus.ACTIVE },
      orderBy: { joinedAt: 'desc' },
      take: MEMBER_AVATAR_PREVIEW_LIMIT,
      include: { user: { select: { id: true, username: true, avatarUrl: true } } },
    }),
  ]);

  return {
    activeMemberCount,
    memberAvatarPreview: previewRows.map((row) => toAuthor(row.user)),
  };
}
