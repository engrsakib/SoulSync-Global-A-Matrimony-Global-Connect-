import type { SubscriptionPlanFeatureDto } from '@soulsync/shared-types/subscription-catalog';

export function isSubscriptionPlanFeatureDto(value: unknown): value is SubscriptionPlanFeatureDto {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.label !== 'string') {
    return false;
  }
  if (row.included !== undefined && typeof row.included !== 'boolean') {
    return false;
  }
  return true;
}
