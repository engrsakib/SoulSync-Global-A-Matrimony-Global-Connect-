export const SUBSCRIPTION_TIERS = ['SILVER', 'GOLD', 'PLATINUM'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const SUBSCRIPTION_BILLING_INTERVALS = ['MONTHLY', 'YEARLY'] as const;
export type SubscriptionBillingInterval = (typeof SUBSCRIPTION_BILLING_INTERVALS)[number];

export type SubscriptionPlanFeatureDto = {
  id: string;
  label: string;
  included: boolean;
};

export type SubscriptionPlanDto = {
  id: string;
  slug: string;
  tier: SubscriptionTier;
  interval: SubscriptionBillingInterval;
  name: string;
  tagline?: string;
  priceCents: number;
  currency: string;
  isFeatured: boolean;
  sortOrder: number;
  features: SubscriptionPlanFeatureDto[];
};

export type SubscriptionCatalogPageDto = {
  badge: string;
  title: string;
  description: string;
  yearlySaveLabel: string;
};

export type SubscriptionCatalogDto = {
  page: SubscriptionCatalogPageDto;
  plans: SubscriptionPlanDto[];
  featuredPlanSlug: string | null;
};

export type ValidateSubscriptionCouponRequestDto = {
  code: string;
  planSlug: string;
};

export type ValidateSubscriptionCouponResponseDto = {
  valid: boolean;
  message: string;
  discountedPriceCents?: number;
  discountLabel?: string;
};

export type CreateSubscriptionCheckoutIntentRequestDto = {
  planSlug: string;
  couponCode?: string;
};

export type SubscriptionCheckoutIntentDto = {
  intentId: string;
  message: string;
  planSlug: string;
  priceCents: number;
  discountedPriceCents: number;
  currency: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === 'string' && (SUBSCRIPTION_TIERS as readonly string[]).includes(value);
}

function isSubscriptionBillingInterval(value: unknown): value is SubscriptionBillingInterval {
  return (
    typeof value === 'string' &&
    (SUBSCRIPTION_BILLING_INTERVALS as readonly string[]).includes(value)
  );
}

function isSubscriptionPlanFeature(value: unknown): value is SubscriptionPlanFeatureDto {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.included === 'boolean'
  );
}

export function isSubscriptionPlanDto(value: unknown): value is SubscriptionPlanDto {
  if (!isRecord(value)) {
    return false;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.slug !== 'string' ||
    !isSubscriptionTier(value.tier) ||
    !isSubscriptionBillingInterval(value.interval) ||
    typeof value.name !== 'string' ||
    typeof value.priceCents !== 'number' ||
    typeof value.currency !== 'string' ||
    typeof value.isFeatured !== 'boolean' ||
    typeof value.sortOrder !== 'number' ||
    !Array.isArray(value.features) ||
    !value.features.every(isSubscriptionPlanFeature)
  ) {
    return false;
  }
  if (value.tagline !== undefined && typeof value.tagline !== 'string') {
    return false;
  }
  return true;
}

function isSubscriptionCatalogPageDto(value: unknown): value is SubscriptionCatalogPageDto {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.badge === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    typeof value.yearlySaveLabel === 'string'
  );
}

export function isSubscriptionCatalogDto(value: unknown): value is SubscriptionCatalogDto {
  if (!isRecord(value)) {
    return false;
  }
  if (
    !isSubscriptionCatalogPageDto(value.page) ||
    !Array.isArray(value.plans) ||
    !value.plans.every(isSubscriptionPlanDto)
  ) {
    return false;
  }
  if (value.featuredPlanSlug !== null && typeof value.featuredPlanSlug !== 'string') {
    return false;
  }
  return true;
}

export function isValidateSubscriptionCouponResponseDto(
  value: unknown,
): value is ValidateSubscriptionCouponResponseDto {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.valid !== 'boolean' || typeof value.message !== 'string') {
    return false;
  }
  if (value.discountedPriceCents !== undefined && typeof value.discountedPriceCents !== 'number') {
    return false;
  }
  if (value.discountLabel !== undefined && typeof value.discountLabel !== 'string') {
    return false;
  }
  return true;
}

export function isSubscriptionCheckoutIntentDto(
  value: unknown,
): value is SubscriptionCheckoutIntentDto {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.intentId === 'string' &&
    typeof value.message === 'string' &&
    typeof value.planSlug === 'string' &&
    typeof value.priceCents === 'number' &&
    typeof value.discountedPriceCents === 'number' &&
    typeof value.currency === 'string'
  );
}
