/** Weights and decay for community post hot / personalized ranking. */
export const FEED_RANKING = {
  weightReaction: 1,
  weightComment: 2,
  weightShare: 3,
  gravity: 1.5,
  religionBoost: 0.15,
  countryBoost: 0.15,
  ageBoostMax: 0.12,
  agePeerBandYears: 5,
  authorInteractionStep: 0.08,
  authorInteractionCap: 0.4,
  candidateMultiplier: 4,
} as const;

export type FeedRankingConfig = typeof FEED_RANKING;
