import type { Religion } from '@soulsync/db';
import { FEED_RANKING, type FeedRankingConfig } from './feed-ranking.config';

export type EngagementCounts = {
  reactionsCount: number;
  commentsCount: number;
  sharesCount: number;
};

export type ProfileMatchInput = {
  viewerReligion: Religion | null;
  authorReligion: Religion | null;
  viewerCountryNormalized: string | null;
  authorCountryNormalized: string | null;
  viewerAge: number | null;
  authorAge: number | null;
  communityMinAge: number | null;
  communityMaxAge: number | null;
};

export function computeEngagementScore(
  counts: EngagementCounts,
  config: FeedRankingConfig = FEED_RANKING,
): number {
  return (
    counts.reactionsCount * config.weightReaction +
    counts.commentsCount * config.weightComment +
    counts.sharesCount * config.weightShare
  );
}

export function computeHotScore(
  counts: EngagementCounts,
  anchorTime: Date,
  now: Date = new Date(),
  config: FeedRankingConfig = FEED_RANKING,
): number {
  const engagement = computeEngagementScore(counts, config);
  if (engagement <= 0) {
    return 0;
  }
  const hours = Math.max(1, (now.getTime() - anchorTime.getTime()) / 3_600_000);
  return engagement / Math.pow(hours + 2, config.gravity);
}

export function normalizeCountryCode(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim().toUpperCase();
  return trimmed ? trimmed : null;
}

export function computeProfileMatchMultiplier(
  input: ProfileMatchInput,
  config: FeedRankingConfig = FEED_RANKING,
): number {
  let boost = 0;

  if (
    input.viewerReligion != null &&
    input.authorReligion != null &&
    input.viewerReligion === input.authorReligion
  ) {
    boost += config.religionBoost;
  }

  if (
    input.viewerCountryNormalized &&
    input.authorCountryNormalized &&
    input.viewerCountryNormalized === input.authorCountryNormalized
  ) {
    boost += config.countryBoost;
  }

  if (input.viewerAge != null && input.authorAge != null) {
    const diff = Math.abs(input.viewerAge - input.authorAge);
    const band = config.agePeerBandYears;
    if (diff <= band) {
      boost += config.ageBoostMax * (1 - diff / band);
    }
  }

  return 1 + boost;
}

export function computeAuthorAffinityMultiplier(
  priorReactionCount: number,
  config: FeedRankingConfig = FEED_RANKING,
): number {
  const extra = Math.min(
    config.authorInteractionCap,
    Math.max(0, priorReactionCount) * config.authorInteractionStep,
  );
  return 1 + extra;
}

export function computePersonalizedScore(
  hotScore: number,
  profileMultiplier: number,
  authorAffinityMultiplier: number,
): number {
  return hotScore * profileMultiplier * authorAffinityMultiplier;
}
