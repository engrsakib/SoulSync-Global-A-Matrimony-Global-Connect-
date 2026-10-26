import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  SubscriptionCatalogDto,
  SubscriptionPlanDto,
} from '@soulsync/shared-types/subscription-catalog';
import type { PrismaClient } from './index';
import {
  SubscriptionBillingInterval,
  SubscriptionCouponDiscountType,
  SubscriptionPlanStatus,
  SubscriptionTier,
} from './index';

type PlanFeature = { id: string; label: string };

type PlanDef = {
  slug: string;
  tier: SubscriptionTier;
  interval: SubscriptionBillingInterval;
  name: string;
  tagline: string;
  compareAtPriceCents: number;
  priceCents: number;
  validityDays: number;
  sortOrder: number;
  isFeatured: boolean;
  features: PlanFeature[];
};

const LEGACY_SLUGS = [
  'silver-monthly',
  'gold-monthly',
  'platinum-monthly',
  'silver-yearly',
  'gold-yearly',
  'platinum-yearly',
];

const PLAN_DEFS: PlanDef[] = [
  {
    slug: 'spark-monthly',
    tier: SubscriptionTier.SPARK,
    interval: SubscriptionBillingInterval.MONTHLY,
    name: 'Spark',
    tagline: 'Ideal for new users getting started.',
    compareAtPriceCents: 799,
    priceCents: 399,
    validityDays: 30,
    sortOrder: 10,
    isFeatured: false,
    features: [
      { id: 'biodata-views', label: 'View 10 Biodatas' },
      { id: 'profile-boost', label: '10-Day Profile Boost' },
      { id: 'dm', label: 'Direct Messaging with 10 People (Mutual Consent)' },
      { id: 'support', label: 'Standard Support & Profile Viewer' },
    ],
  },
  {
    slug: 'velocity-monthly',
    tier: SubscriptionTier.VELOCITY,
    interval: SubscriptionBillingInterval.MONTHLY,
    name: 'Velocity',
    tagline: 'Perfect for those looking for faster responses and better reach.',
    compareAtPriceCents: 1599,
    priceCents: 899,
    validityDays: 30,
    sortOrder: 20,
    isFeatured: true,
    features: [
      { id: 'biodata-views', label: 'View 30 Biodatas' },
      { id: 'profile-boost', label: '30-Day Profile Boost' },
      { id: 'dm', label: 'Direct Messaging with 30 People (Mutual Consent)' },
      { id: 'priority', label: 'Priority Search Results & Instant Chat Notifications' },
    ],
  },
  {
    slug: 'nexus-monthly',
    tier: SubscriptionTier.NEXUS,
    interval: SubscriptionBillingInterval.MONTHLY,
    name: 'Nexus',
    tagline: 'Designed for users seeking maximum benefits and premium features.',
    compareAtPriceCents: 5099,
    priceCents: 2599,
    validityDays: 30,
    sortOrder: 30,
    isFeatured: false,
    features: [
      { id: 'biodata-views', label: 'Unlimited Biodata Views' },
      { id: 'profile-boost', label: '30-Day Top-Tier Profile Boost' },
      { id: 'dm', label: 'Unlimited Direct Messaging' },
      { id: 'vip', label: 'Dedicated VIP Support & Advanced Filtering' },
    ],
  },
  {
    slug: 'spark-yearly',
    tier: SubscriptionTier.SPARK,
    interval: SubscriptionBillingInterval.YEARLY,
    name: 'Spark',
    tagline: 'Ideal for new users getting started with long-term savings.',
    compareAtPriceCents: 7099,
    priceCents: 3099,
    validityDays: 365,
    sortOrder: 10,
    isFeatured: false,
    features: [
      { id: 'biodata-views', label: 'View 120 Biodatas (10/mo equivalent)' },
      { id: 'profile-boost', label: '100-Day Profile Boost' },
      { id: 'dm', label: 'Direct Messaging with 100 People (Mutual Consent)' },
      { id: 'support', label: 'Standard Support & Profile Viewer' },
    ],
  },
  {
    slug: 'velocity-yearly',
    tier: SubscriptionTier.VELOCITY,
    interval: SubscriptionBillingInterval.YEARLY,
    name: 'Velocity',
    tagline: 'Perfect for active seekers maximizing visibility and reach.',
    compareAtPriceCents: 15099,
    priceCents: 8099,
    validityDays: 365,
    sortOrder: 20,
    isFeatured: true,
    features: [
      { id: 'biodata-views', label: 'View 360 Biodatas (30/mo equivalent)' },
      { id: 'profile-boost', label: '300-Day Profile Boost' },
      { id: 'dm', label: 'Direct Messaging with 300 People (Mutual Consent)' },
      { id: 'priority', label: 'Priority Search Results & Instant Chat Notifications' },
    ],
  },
  {
    slug: 'nexus-yearly',
    tier: SubscriptionTier.NEXUS,
    interval: SubscriptionBillingInterval.YEARLY,
    name: 'Nexus',
    tagline: 'Ultimate year-round VIP access with top-tier placement.',
    compareAtPriceCents: 50099,
    priceCents: 25999,
    validityDays: 365,
    sortOrder: 30,
    isFeatured: false,
    features: [
      { id: 'biodata-views', label: 'Unlimited Biodata Views' },
      { id: 'profile-boost', label: '365-Day Top-Tier Profile Boost' },
      { id: 'dm', label: 'Unlimited Direct Messaging' },
      { id: 'vip', label: 'Dedicated VIP Support & Advanced Filtering' },
    ],
  },
];

export function buildSeedSubscriptionCatalogDto(): SubscriptionCatalogDto {
  const page = loadSubscriptionCatalogPageSeed();
  const plans: SubscriptionPlanDto[] = PLAN_DEFS.map((plan) => ({
    id: `seed-${plan.slug}`,
    slug: plan.slug,
    tier: plan.tier,
    interval: plan.interval,
    name: plan.name,
    tagline: plan.tagline,
    priceCents: plan.priceCents,
    compareAtPriceCents: plan.compareAtPriceCents,
    validityDays: plan.validityDays,
    currency: 'USD',
    isFeatured: plan.isFeatured,
    sortOrder: plan.sortOrder,
    features: plan.features,
  }));
  const featured = plans.find((p) => p.isFeatured) ?? plans[0] ?? null;
  return {
    page,
    plans,
    featuredPlanSlug: featured?.slug ?? null,
  };
}

function writeSubscriptionCatalogFallbackJson(): void {
  const catalog = buildSeedSubscriptionCatalogDto();
  const path = resolve(__dirname, '../data/subscription-catalog-fallback.json');
  writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
}

export function loadSubscriptionCatalogPageSeed(): {
  badge: string;
  title: string;
  description: string;
  yearlySaveLabel: string;
} {
  const path = resolve(__dirname, '../data/subscription-catalog-page.json');
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as {
    badge: string;
    title: string;
    description: string;
    yearlySaveLabel: string;
  };
}

export async function seedSubscriptionPlans(prisma: PrismaClient): Promise<void> {
  await prisma.subscriptionPlan.updateMany({
    where: { slug: { in: LEGACY_SLUGS } },
    data: { status: SubscriptionPlanStatus.ARCHIVED },
  });

  for (const plan of PLAN_DEFS) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        tier: plan.tier,
        interval: plan.interval,
        name: plan.name,
        tagline: plan.tagline,
        priceCents: plan.priceCents,
        compareAtPriceCents: plan.compareAtPriceCents,
        validityDays: plan.validityDays,
        sortOrder: plan.sortOrder,
        isFeatured: plan.isFeatured,
        features: plan.features,
        status: SubscriptionPlanStatus.ACTIVE,
        currency: 'USD',
      },
      create: {
        slug: plan.slug,
        tier: plan.tier,
        interval: plan.interval,
        name: plan.name,
        tagline: plan.tagline,
        priceCents: plan.priceCents,
        compareAtPriceCents: plan.compareAtPriceCents,
        validityDays: plan.validityDays,
        sortOrder: plan.sortOrder,
        isFeatured: plan.isFeatured,
        features: plan.features,
        status: SubscriptionPlanStatus.ACTIVE,
        currency: 'USD',
      },
    });
  }

  await prisma.subscriptionCoupon.upsert({
    where: { code: 'WELCOME30' },
    update: {
      description: 'Launch welcome — 30% off first checkout (stub)',
      discountType: SubscriptionCouponDiscountType.PERCENT,
      discountValue: 30,
      isActive: true,
    },
    create: {
      code: 'WELCOME30',
      description: 'Launch welcome — 30% off first checkout (stub)',
      discountType: SubscriptionCouponDiscountType.PERCENT,
      discountValue: 30,
      isActive: true,
      maxRedemptions: 10_000,
    },
  });

  await prisma.subscriptionCoupon.upsert({
    where: { code: 'VELOCITY10' },
    update: {
      description: 'Velocity plans — $10 off',
      discountType: SubscriptionCouponDiscountType.FIXED_CENTS,
      discountValue: 1000,
      applicableTier: SubscriptionTier.VELOCITY,
      isActive: true,
    },
    create: {
      code: 'VELOCITY10',
      description: 'Velocity plans — $10 off',
      discountType: SubscriptionCouponDiscountType.FIXED_CENTS,
      discountValue: 1000,
      applicableTier: SubscriptionTier.VELOCITY,
      isActive: true,
      maxRedemptions: 500,
    },
  });

  await prisma.subscriptionCoupon.updateMany({
    where: { code: 'GOLD10' },
    data: { isActive: false },
  });

  writeSubscriptionCatalogFallbackJson();
}
