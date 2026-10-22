import {
  computeAuthorAffinityMultiplier,
  computeEngagementScore,
  computeHotScore,
  computePersonalizedScore,
  computeProfileMatchMultiplier,
} from '../src/communities/feed-ranking.util';

describe('feed-ranking.util', () => {
  it('computes weighted engagement', () => {
    expect(computeEngagementScore({ reactionsCount: 2, commentsCount: 1, sharesCount: 1 })).toBe(7);
  });

  it('applies time decay to hot score', () => {
    const anchor = new Date('2026-10-22T00:00:00.000Z');
    const now = new Date('2026-10-22T12:00:00.000Z');
    const score = computeHotScore(
      { reactionsCount: 10, commentsCount: 0, sharesCount: 0 },
      anchor,
      now,
    );
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(10);
  });

  it('boosts profile matches', () => {
    const mult = computeProfileMatchMultiplier({
      viewerReligion: 'ISLAM',
      authorReligion: 'ISLAM',
      viewerCountryNormalized: 'BD',
      authorCountryNormalized: 'BD',
      viewerAge: 28,
      authorAge: 30,
      communityMinAge: 21,
      communityMaxAge: 35,
    });
    expect(mult).toBeGreaterThan(1);
  });

  it('combines collaborative affinity', () => {
    expect(computeAuthorAffinityMultiplier(3)).toBeCloseTo(1.24, 2);
  });

  it('computes personalized score', () => {
    expect(computePersonalizedScore(5, 1.2, 1.1)).toBeCloseTo(6.6, 5);
  });
});
