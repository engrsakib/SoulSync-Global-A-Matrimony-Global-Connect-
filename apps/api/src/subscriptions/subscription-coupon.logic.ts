import type {
  SubscriptionBillingInterval,
  SubscriptionTier,
} from '@soulsync/shared-types/subscription-catalog';
import { SubscriptionCouponDiscountType } from '@soulsync/db';

type CouponRow = {
  discountType: SubscriptionCouponDiscountType;
  discountValue: number;
  applicableTier: SubscriptionTier | null;
  applicableInterval: SubscriptionBillingInterval | null;
  isActive: boolean;
  validFrom: Date | null;
  validUntil: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
};

export type CouponApplyResult =
  | { valid: true; discountedPriceCents: number; discountLabel: string }
  | { valid: false; message: string };

function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function applyCouponToPrice(
  priceCents: number,
  coupon: CouponRow,
  plan: { tier: SubscriptionTier; interval: SubscriptionBillingInterval },
  now = new Date(),
): CouponApplyResult {
  if (!coupon.isActive) {
    return { valid: false, message: 'This coupon is no longer active.' };
  }
  if (coupon.validFrom && now < coupon.validFrom) {
    return { valid: false, message: 'This coupon is not valid yet.' };
  }
  if (coupon.validUntil && now > coupon.validUntil) {
    return { valid: false, message: 'This coupon has expired.' };
  }
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { valid: false, message: 'This coupon has reached its redemption limit.' };
  }
  if (coupon.applicableTier && coupon.applicableTier !== plan.tier) {
    return { valid: false, message: 'This coupon does not apply to the selected plan tier.' };
  }
  if (coupon.applicableInterval && coupon.applicableInterval !== plan.interval) {
    return { valid: false, message: 'This coupon does not apply to the selected billing period.' };
  }

  if (coupon.discountType === SubscriptionCouponDiscountType.PERCENT) {
    const pct = Math.min(100, Math.max(0, coupon.discountValue));
    return {
      valid: true,
      discountedPriceCents: Math.max(0, Math.round(priceCents * (1 - pct / 100))),
      discountLabel: `${pct}% off`,
    };
  }

  return {
    valid: true,
    discountedPriceCents: Math.max(0, priceCents - coupon.discountValue),
    discountLabel: `$${(coupon.discountValue / 100).toFixed(0)} off`,
  };
}

export { normalizeCouponCode };
