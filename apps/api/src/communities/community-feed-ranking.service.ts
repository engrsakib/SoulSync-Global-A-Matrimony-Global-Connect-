import { Injectable } from '@nestjs/common';
import type { Community, Profile, Religion } from '@soulsync/db';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { ageFromDateOfBirth } from './community-age.util';
import { FEED_RANKING } from './feed-ranking.config';
import {
  computeAuthorAffinityMultiplier,
  computePersonalizedScore,
  computeProfileMatchMultiplier,
  normalizeCountryCode,
} from './feed-ranking.util';

export type RankablePostRow = {
  id: string;
  authorUserId: string;
  hotScore: number;
  communityId?: string;
};

export type RankedPost = RankablePostRow & {
  personalizedScore: number;
};

export type ViewerRankingContext = {
  religion: Religion | null;
  countryNormalized: string | null;
  age: number | null;
  authorReactionCounts: Map<string, number>;
};

@Injectable()
export class CommunityFeedRankingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldEncryptionService,
  ) {}

  async buildViewerContext(
    userId: string,
    scope: { communityId?: string; communityIds?: string[] },
  ): Promise<ViewerRankingContext> {
    const communityFilter =
      scope.communityIds && scope.communityIds.length > 0
        ? { communityId: { in: scope.communityIds } }
        : scope.communityId
          ? { communityId: scope.communityId }
          : null;

    const [user, affinityRows] = await Promise.all([
      this.prisma.client.user.findUnique({
        where: { id: userId },
        include: { profile: true },
      }),
      communityFilter
        ? this.prisma.client.communityReaction.findMany({
            where: {
              userId,
              postId: { not: null },
              post: { ...communityFilter, deletedAt: null },
            },
            select: { post: { select: { authorUserId: true } } },
          })
        : Promise.resolve([]),
    ]);

    const profile = user?.profile ?? null;
    const religion = profile?.religion ?? null;
    const countryNormalized = normalizeCountryCode(
      profile ? (this.crypto.decryptString(profile.country) ?? profile.country) : null,
    );
    const age = profile?.dateOfBirth ? ageFromDateOfBirth(profile.dateOfBirth) : null;

    const authorReactionCounts = new Map<string, number>();
    for (const row of affinityRows) {
      const authorId = row.post?.authorUserId;
      if (!authorId) {
        continue;
      }
      authorReactionCounts.set(authorId, (authorReactionCounts.get(authorId) ?? 0) + 1);
    }

    return { religion, countryNormalized, age, authorReactionCounts };
  }

  async loadAuthorProfiles(
    authorUserIds: string[],
  ): Promise<Map<string, Pick<Profile, 'religion' | 'country' | 'dateOfBirth'>>> {
    if (authorUserIds.length === 0) {
      return new Map();
    }
    const unique = [...new Set(authorUserIds)];
    const rows = await this.prisma.client.profile.findMany({
      where: { userId: { in: unique } },
      select: { userId: true, religion: true, country: true, dateOfBirth: true },
    });
    return new Map(rows.map((row) => [row.userId, row]));
  }

  rankPosts(
    posts: RankablePostRow[],
    viewer: ViewerRankingContext,
    communitiesById: Map<string, Pick<Community, 'minAge' | 'maxAge'>>,
    authorProfiles: Map<string, Pick<Profile, 'religion' | 'country' | 'dateOfBirth'>>,
    defaultCommunity?: Pick<Community, 'minAge' | 'maxAge'>,
  ): RankedPost[] {
    const ranked = posts.map((post) => {
      const community = (post.communityId ? communitiesById.get(post.communityId) : undefined) ??
        defaultCommunity ?? { minAge: null, maxAge: null };
      const authorProfile = authorProfiles.get(post.authorUserId);
      const authorCountry = authorProfile
        ? normalizeCountryCode(
            this.crypto.decryptString(authorProfile.country) ?? authorProfile.country,
          )
        : null;
      const authorAge = authorProfile?.dateOfBirth
        ? ageFromDateOfBirth(authorProfile.dateOfBirth)
        : null;

      const profileMultiplier = computeProfileMatchMultiplier({
        viewerReligion: viewer.religion,
        authorReligion: authorProfile?.religion ?? null,
        viewerCountryNormalized: viewer.countryNormalized,
        authorCountryNormalized: authorCountry,
        viewerAge: viewer.age,
        authorAge,
        communityMinAge: community.minAge,
        communityMaxAge: community.maxAge,
      });

      const authorAffinityMultiplier = computeAuthorAffinityMultiplier(
        viewer.authorReactionCounts.get(post.authorUserId) ?? 0,
        FEED_RANKING,
      );

      const personalizedScore = computePersonalizedScore(
        post.hotScore,
        profileMultiplier,
        authorAffinityMultiplier,
      );

      return { ...post, personalizedScore };
    });

    ranked.sort((a, b) => {
      if (b.personalizedScore !== a.personalizedScore) {
        return b.personalizedScore - a.personalizedScore;
      }
      if (b.hotScore !== a.hotScore) {
        return b.hotScore - a.hotScore;
      }
      return b.id.localeCompare(a.id);
    });

    return ranked;
  }
}
