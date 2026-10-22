import { unwrapBffPayload } from '@soulsync/shared-types/api-response';

describe('unwrapBffPayload', () => {
  it('unwraps Next.js BFF { data } bodies', () => {
    const status = unwrapBffPayload<{ checkedInToday: boolean }>({
      data: { checkedInToday: true },
    });
    expect(status.checkedInToday).toBe(true);
  });

  it('unwraps Nest success envelopes then BFF data when nested', () => {
    const inner = unwrapBffPayload<{ pointsAwarded: number }>({
      success: true,
      statusCode: 200,
      data: { pointsAwarded: 5 },
    });
    expect(inner.pointsAwarded).toBe(5);
  });
});
