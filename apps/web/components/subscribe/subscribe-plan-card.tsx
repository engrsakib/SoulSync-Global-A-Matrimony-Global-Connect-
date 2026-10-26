import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import type { SubscriptionPlanDto } from '@soulsync/shared-types/subscription-catalog';
import {
  marketingBrandHairlineClass,
  marketingCardClass,
  marketingFeaturedCardClass,
} from '@/lib/marketing-ui-classes';
import { formatUsdFromCents } from '@/lib/subscription/format-price';

type SubscribePlanCardProps = {
  plan: SubscriptionPlanDto;
  intervalLabel: string;
  displayPriceCents: number;
  featured?: boolean;
  cta: ReactNode;
};

const TIER_CHIP_CLASS: Record<SubscriptionPlanDto['tier'], string> = {
  SPARK:
    'bg-[color-mix(in_oklab,var(--muted-foreground)_25%,var(--muted))] ring-1 ring-[var(--border)]',
  VELOCITY: 'bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-800)]',
  NEXUS:
    'bg-[color-mix(in_oklab,var(--highlight-pill-accent)_55%,var(--muted))] ring-1 ring-[color-mix(in_oklab,var(--highlight-pill-accent)_35%,var(--border))]',
};

function validityAccessLabel(validityDays: number): string {
  if (validityDays === 30) {
    return '30-day access';
  }
  if (validityDays === 365) {
    return '365-day access';
  }
  return `${validityDays}-day access`;
}

export function SubscribePlanCard({
  plan,
  intervalLabel,
  displayPriceCents,
  featured = false,
  cta,
}: SubscribePlanCardProps) {
  const shellClass = featured ? marketingFeaturedCardClass : marketingCardClass;
  const showCompareAt =
    typeof plan.compareAtPriceCents === 'number' &&
    plan.compareAtPriceCents > plan.priceCents;

  return (
    <article
      className={cn(
        shellClass,
        'flex flex-col overflow-hidden',
        featured &&
          'md:-translate-y-1 md:shadow-[0_24px_60px_-28px_color-mix(in_srgb,var(--color-brand-700)_45%,transparent)]',
      )}
    >
      {featured ? <div className={marketingBrandHairlineClass} aria-hidden /> : null}
      <div
        className={cn(
          'flex flex-1 flex-col p-6 md:p-7',
          featured && 'bg-[color-mix(in_oklab,var(--color-brand-500)_6%,var(--card))]',
        )}
      >
        <div className="space-y-4 border-b border-[var(--border)] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn('h-2.5 w-2.5 rounded-sm', TIER_CHIP_CLASS[plan.tier])}
              aria-hidden
            />
            <span className="text-xs font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
              {plan.name}
            </span>
            {featured ? (
              <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[var(--primary-foreground)] uppercase">
                Most Popular
              </span>
            ) : null}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
                {formatUsdFromCents(displayPriceCents)}
              </span>
              <span className="pb-1 text-sm text-[var(--muted-foreground)]">/{intervalLabel}</span>
            </div>
            {showCompareAt ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                <span className="sr-only">Regular price </span>
                <span className="line-through">{formatUsdFromCents(plan.compareAtPriceCents!)}</span>
              </p>
            ) : null}
            <p className="text-xs font-medium text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]">
              {validityAccessLabel(plan.validityDays)}
            </p>
          </div>
          {plan.tagline ? (
            <p className="text-sm text-[var(--muted-foreground)]">{plan.tagline}</p>
          ) : null}
        </div>

        <div className="py-6">{cta}</div>

        <ul className="mt-auto space-y-3 border-t border-[var(--border)] pt-6">
          {plan.features.map((feature) => {
            const included = feature.included !== false;
            if (!included) {
              return null;
            }
            return (
              <li key={feature.id} className="flex items-start gap-3 text-sm">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]"
                  aria-hidden
                />
                <span className="text-[var(--foreground)]">{feature.label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </article>
  );
}
