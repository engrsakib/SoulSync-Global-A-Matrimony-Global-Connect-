export const SUBSCRIPTION_TIERS = ['SPARK', 'VELOCITY', 'NEXUS'] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

/** Alias for UI billing toggle (maps to API `SubscriptionBillingInterval`). */
export type BillingCycle = SubscriptionBillingInterval;

export const SUBSCRIPTION_BILLING_INTERVALS = ['MONTHLY', 'YEARLY'] as const;
export type SubscriptionBillingInterval = (typeof SUBSCRIPTION_BILLING_INTERVALS)[number];

export type SubscriptionPlanFeatureDto = {
  id: string;
  label: string;
  /** Legacy seed rows; UI treats all bullets as included when omitted. */
  included?: boolean;
};

export type SubscriptionPlanDto = {
  id: string;
  slug: string;
  tier: SubscriptionTier;
  interval: SubscriptionBillingInterval;
  name: string;
  tagline?: string;
  /** Offer price (charged at checkout). */
  priceCents: number;
  compareAtPriceCents?: number;
  validityDays: number;
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

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || value === null || typeof value === 'string';
}

function optionalNumber(value: unknown): value is number | undefined {
  return value === undefined || value === null || typeof value === 'number';
}

function isSubscriptionPlanFeature(value: unknown): value is SubscriptionPlanFeatureDto {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value.id !== 'string' || typeof value.label !== 'string') {
    return false;
  }
  if (value.included != null && typeof value.included !== 'boolean') {
    return false;
  }
  return true;
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
    typeof value.validityDays !== 'number' ||
    typeof value.currency !== 'string' ||
    typeof value.isFeatured !== 'boolean' ||
    typeof value.sortOrder !== 'number' ||
    !Array.isArray(value.features) ||
    !value.features.every(isSubscriptionPlanFeature)
  ) {
    return false;
  }
  if (!optionalString(value.tagline)) {
    return false;
  }
  if (!optionalNumber(value.compareAtPriceCents)) {
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
  if (
    value.featuredPlanSlug !== null &&
    value.featuredPlanSlug !== undefined &&
    typeof value.featuredPlanSlug !== 'string'
  ) {
    return false;
  }
  return true;
}

function normalizeSubscriptionPlanFeature(
  value: unknown,
): SubscriptionPlanFeatureDto | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string') {
    return null;
  }
  const included =
    value.included === null || value.included === undefined
      ? undefined
      : typeof value.included === 'boolean'
        ? value.included
        : undefined;
  return included === undefined ? { id: value.id, label: value.label } : { id: value.id, label: value.label, included };
}

function normalizeSubscriptionPlan(value: unknown): SubscriptionPlanDto | null {
  if (!isRecord(value)) {
    return null;
  }
  const normalized: unknown = {
    ...value,
    tagline: value.tagline === null ? undefined : value.tagline,
    compareAtPriceCents:
      value.compareAtPriceCents === null ? undefined : value.compareAtPriceCents,
    features: Array.isArray(value.features)
      ? value.features
          .map(normalizeSubscriptionPlanFeature)
          .filter((f): f is SubscriptionPlanFeatureDto => f !== null)
      : value.features,
  };
  return isSubscriptionPlanDto(normalized) ? normalized : null;
}

/** Coerce API/Redis JSON (null optionals, legacy shapes) then validate. */
export function parseSubscriptionCatalogDto(value: unknown): SubscriptionCatalogDto | null {
  if (!isRecord(value) || !isSubscriptionCatalogPageDto(value.page) || !Array.isArray(value.plans)) {
    return null;
  }
  const plans = value.plans
    .map(normalizeSubscriptionPlan)
    .filter((p): p is SubscriptionPlanDto => p !== null);
  const featuredPlanSlug =
    value.featuredPlanSlug === undefined ? null : (value.featuredPlanSlug as string | null);
  const candidate = {
    page: value.page,
    plans,
    featuredPlanSlug,
  };
  return isSubscriptionCatalogDto(candidate) ? candidate : null;
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
