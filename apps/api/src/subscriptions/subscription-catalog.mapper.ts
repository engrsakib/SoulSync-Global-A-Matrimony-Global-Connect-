import type { Prisma } from '@soulsync/db';
import type {
  SubscriptionCatalogDto,
  SubscriptionPlanDto,
  SubscriptionPlanFeatureDto,
} from '@soulsync/shared-types/subscription-catalog';
import { isSubscriptionPlanFeatureDto } from './subscription-plan-feature.guard';

type PlanRow = {
  id: string;
  slug: string;
  tier: SubscriptionPlanDto['tier'];
  interval: SubscriptionPlanDto['interval'];
  name: string;
  tagline: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  validityDays: number;
  currency: string;
  isFeatured: boolean;
  sortOrder: number;
  features: Prisma.JsonValue;
};

function parseFeatures(value: Prisma.JsonValue): SubscriptionPlanFeatureDto[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isSubscriptionPlanFeatureDto);
}

export function toSubscriptionPlanDto(row: PlanRow): SubscriptionPlanDto {
  return {
    id: row.id,
    slug: row.slug,
    tier: row.tier,
    interval: row.interval,
    name: row.name,
    tagline: row.tagline ?? undefined,
    priceCents: row.priceCents,
    compareAtPriceCents: row.compareAtPriceCents ?? undefined,
    validityDays: row.validityDays,
    currency: row.currency,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
    features: parseFeatures(row.features),
  };
}

export function buildCatalogDto(
  page: SubscriptionCatalogDto['page'],
  plans: PlanRow[],
): SubscriptionCatalogDto {
  const dtos = plans.map(toSubscriptionPlanDto);
  const featured = dtos.find((p) => p.isFeatured) ?? dtos[0] ?? null;
  return {
    page,
    plans: dtos,
    featuredPlanSlug: featured?.slug ?? null,
  };
}
