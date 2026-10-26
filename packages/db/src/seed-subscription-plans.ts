import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PrismaClient } from './index';
import {
  SubscriptionBillingInterval,
  SubscriptionCouponDiscountType,
  SubscriptionPlanStatus,
  SubscriptionTier,
} from './index';

type FeatureRow = { id: string; label: string };

const FEATURE_ROWS: FeatureRow[] = [
  { id: 'biodata-suite', label: 'Full biodata & profile editor' },
  { id: 'priority-support', label: 'Priority member support' },
  { id: 'advanced-discovery', label: 'Advanced discovery & compatibility' },
  { id: 'proposal-credits', label: 'Expanded monthly proposal credits' },
  { id: 'guardian-tools', label: 'Guardian & family collaboration tools' },
  { id: 'dashboard-analytics', label: 'Member dashboard & insights' },
];

type TierFlags = Record<string, boolean>;

const TIER_FEATURES: Record<SubscriptionTier, TierFlags> = {
  [SubscriptionTier.SILVER]: {
    'biodata-suite': true,
    'priority-support': false,
    'advanced-discovery': false,
    'proposal-credits': false,
    'guardian-tools': false,
    'dashboard-analytics': true,
  },
  [SubscriptionTier.GOLD]: {
    'biodata-suite': true,
    'priority-support': true,
    'advanced-discovery': false,
    'proposal-credits': true,
    'guardian-tools': true,
    'dashboard-analytics': true,
  },
  [SubscriptionTier.PLATINUM]: {
    'biodata-suite': true,
    'priority-support': true,
    'advanced-discovery': true,
    'proposal-credits': true,
    'guardian-tools': true,
    'dashboard-analytics': true,
  },
};

function featuresForTier(tier: SubscriptionTier) {
  const flags = TIER_FEATURES[tier];
  return FEATURE_ROWS.map((row) => ({
    id: row.id,
    label: row.label,
    included: flags[row.id] ?? false,
  }));
}

const PLAN_DEFS = [
  {
    slug: 'silver-monthly',
    tier: SubscriptionTier.SILVER,
    interval: SubscriptionBillingInterval.MONTHLY,
    name: 'Silver',
    tagline: 'Essentials to get started',
    priceCents: 2500,
    sortOrder: 10,
    isFeatured: false,
  },
  {
    slug: 'gold-monthly',
    tier: SubscriptionTier.GOLD,
    interval: SubscriptionBillingInterval.MONTHLY,
    name: 'Gold',
    tagline: 'Powerful & balanced for active members',
    priceCents: 3500,
    sortOrder: 20,
    isFeatured: true,
  },
  {
    slug: 'platinum-monthly',
    tier: SubscriptionTier.PLATINUM,
    interval: SubscriptionBillingInterval.MONTHLY,
    name: 'Platinum',
    tagline: 'Full platform access for leaders',
    priceCents: 5000,
    sortOrder: 30,
    isFeatured: false,
  },
  {
    slug: 'silver-yearly',
    tier: SubscriptionTier.SILVER,
    interval: SubscriptionBillingInterval.YEARLY,
    name: 'Silver',
    tagline: 'Essentials to get started',
    priceCents: 21000,
    sortOrder: 10,
    isFeatured: false,
  },
  {
    slug: 'gold-yearly',
    tier: SubscriptionTier.GOLD,
    interval: SubscriptionBillingInterval.YEARLY,
    name: 'Gold',
    tagline: 'Powerful & balanced for active members',
    priceCents: 29400,
    sortOrder: 20,
    isFeatured: true,
  },
  {
    slug: 'platinum-yearly',
    tier: SubscriptionTier.PLATINUM,
    interval: SubscriptionBillingInterval.YEARLY,
    name: 'Platinum',
    tagline: 'Full platform access for leaders',
    priceCents: 42000,
    sortOrder: 30,
    isFeatured: false,
  },
] as const;

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
  for (const plan of PLAN_DEFS) {
    await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: {
        tier: plan.tier,
        interval: plan.interval,
        name: plan.name,
        tagline: plan.tagline,
        priceCents: plan.priceCents,
        sortOrder: plan.sortOrder,
        isFeatured: plan.isFeatured,
        features: featuresForTier(plan.tier),
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
        sortOrder: plan.sortOrder,
        isFeatured: plan.isFeatured,
        features: featuresForTier(plan.tier),
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
    where: { code: 'GOLD10' },
    update: {
      description: 'Gold plans — $10 off',
      discountType: SubscriptionCouponDiscountType.FIXED_CENTS,
      discountValue: 1000,
      applicableTier: SubscriptionTier.GOLD,
      isActive: true,
    },
    create: {
      code: 'GOLD10',
      description: 'Gold plans — $10 off',
      discountType: SubscriptionCouponDiscountType.FIXED_CENTS,
      discountValue: 1000,
      applicableTier: SubscriptionTier.GOLD,
      isActive: true,
      maxRedemptions: 500,
    },
  });
}
