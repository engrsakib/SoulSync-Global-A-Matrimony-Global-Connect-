import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
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
  SILVER:
    'bg-[color-mix(in_oklab,var(--muted-foreground)_25%,var(--muted))] ring-1 ring-[var(--border)]',
  GOLD: 'bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-800)]',
  PLATINUM:
    'bg-[color-mix(in_oklab,var(--highlight-pill-accent)_55%,var(--muted))] ring-1 ring-[color-mix(in_oklab,var(--highlight-pill-accent)_35%,var(--border))]',
};

export function SubscribePlanCard({
  plan,
  intervalLabel,
  displayPriceCents,
  featured = false,
  cta,
}: SubscribePlanCardProps) {
  const shellClass = featured ? marketingFeaturedCardClass : marketingCardClass;

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
          <div className="flex items-center gap-2">
            <span
              className={cn('h-2.5 w-2.5 rounded-sm', TIER_CHIP_CLASS[plan.tier])}
              aria-hidden
            />
            <span className="text-xs font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
              {plan.name}
            </span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold tracking-tight text-[var(--foreground)]">
              {formatUsdFromCents(displayPriceCents)}
            </span>
            <span className="pb-1 text-sm text-[var(--muted-foreground)]">/{intervalLabel}</span>
          </div>
          {plan.tagline ? (
            <p className="text-sm text-[var(--muted-foreground)]">{plan.tagline}</p>
          ) : null}
        </div>

        <div className="py-6">{cta}</div>

        <ul className="mt-auto space-y-3 border-t border-[var(--border)] pt-6">
          {plan.features.map((feature) => (
            <li key={feature.id} className="flex items-start gap-3 text-sm">
              {feature.included ? (
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]"
                  aria-hidden
                />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted-foreground)]/50" aria-hidden />
              )}
              <span
                className={cn(
                  feature.included
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)]',
                )}
              >
                {feature.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
