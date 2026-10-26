import type { SubscriptionPlanFeatureDto } from '@soulsync/shared-types/subscription-catalog';

export function isSubscriptionPlanFeatureDto(value: unknown): value is SubscriptionPlanFeatureDto {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === 'string' &&
    typeof row.label === 'string' &&
    typeof row.included === 'boolean'
  );
}
