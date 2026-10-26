'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@soulsync/ui/lib/utils';
import { buttonVariants } from '@soulsync/ui/button';
import type {
  SubscriptionBillingInterval,
  SubscriptionCatalogDto,
  SubscriptionPlanDto,
} from '@soulsync/shared-types/subscription-catalog';
import { useCurrentUser } from '@/hooks/use-current-user';
import { formControlClass } from '@/lib/ui-classes';
import { SubscribePlanCard } from '@/components/subscribe/subscribe-plan-card';
import { jsonErrorMessage, jsonStringField } from '@/lib/json-error-message';

type SubscribePricingClientProps = {
  catalog: SubscriptionCatalogDto;
};

type CouponState = {
  code: string;
  discountLabel?: string;
  byPlanSlug: Record<string, number>;
};

function loginHref(planSlug: string): string {
  const next = `/subscribe?plan=${encodeURIComponent(planSlug)}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

export function SubscribePricingClient({ catalog }: SubscribePricingClientProps) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [interval, setInterval] = React.useState<SubscriptionBillingInterval>('MONTHLY');
  const [couponInput, setCouponInput] = React.useState('');
  const [couponState, setCouponState] = React.useState<CouponState | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponPending, setCouponPending] = React.useState(false);
  const [checkoutPlanSlug, setCheckoutPlanSlug] = React.useState<string | null>(null);

  const visiblePlans = React.useMemo(
    () =>
      catalog.plans
        .filter((p) => p.interval === interval)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [catalog.plans, interval],
  );

  const displayPrice = (plan: SubscriptionPlanDto) =>
    couponState?.byPlanSlug[plan.slug] ?? plan.priceCents;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError('Enter a coupon code.');
      return;
    }
    setCouponPending(true);
    setCouponError(null);
    try {
      const byPlanSlug: Record<string, number> = {};
      let discountLabel: string | undefined;
      let anyValid = false;
      for (const plan of visiblePlans) {
        const response = await fetch('/api/public/subscriptions/validate-coupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, planSlug: plan.slug }),
        });
        const data: unknown = await response.json();
        if (!response.ok) {
          continue;
        }
        if (
          !data ||
          typeof data !== 'object' ||
          !('valid' in data) ||
          !(data as { valid: boolean }).valid
        ) {
          continue;
        }
        anyValid = true;
        const row = data as {
          discountedPriceCents?: number;
          discountLabel?: string;
          message?: string;
        };
        if (typeof row.discountedPriceCents === 'number') {
          byPlanSlug[plan.slug] = row.discountedPriceCents;
        }
        discountLabel = row.discountLabel ?? discountLabel;
      }
      if (!anyValid) {
        throw new Error('Coupon is not valid for the selected billing period.');
      }
      setCouponState({ code: code.toUpperCase(), byPlanSlug, discountLabel });
    } catch (err) {
      setCouponState(null);
      setCouponError(err instanceof Error ? err.message : 'Coupon failed');
    } finally {
      setCouponPending(false);
    }
  };

  const startCheckout = async (planSlug: string) => {
    if (!user) {
      router.push(loginHref(planSlug));
      return;
    }
    setCheckoutPlanSlug(planSlug);
    try {
      const response = await fetch('/api/subscriptions/checkout-intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planSlug,
          couponCode: couponState?.code,
        }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        throw new Error(jsonErrorMessage(data, 'Checkout failed'));
      }
      const intentId = jsonStringField(data, 'intentId');
      router.push(
        `/subscribe/thank-you${intentId ? `?intent=${encodeURIComponent(intentId)}` : ''}`,
      );
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutPlanSlug(null);
    }
  };

  const intervalLabel = interval === 'MONTHLY' ? 'month' : 'year';

  return (
    <div className="space-y-10 md:space-y-14">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div
          className="inline-flex rounded-full border border-[var(--border)] bg-[var(--card)]/80 p-1 shadow-sm backdrop-blur-sm"
          role="tablist"
          aria-label="Billing period"
        >
          {(
            [
              { id: 'MONTHLY' as const, label: 'Monthly' },
              { id: 'YEARLY' as const, label: 'Yearly' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={interval === tab.id}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-semibold transition-colors',
                interval === tab.id
                  ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
              onClick={() => setInterval(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]">
          {catalog.page.yearlySaveLabel}
        </span>
      </div>

      {visiblePlans.length === 0 ? (
        <p className="text-center text-[var(--muted-foreground)]">
          Plans are being configured. Please check back soon.
        </p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {visiblePlans.map((plan) => {
            const featured = plan.isFeatured || plan.slug === catalog.featuredPlanSlug;
            return (
              <SubscribePlanCard
                key={plan.id}
                plan={plan}
                intervalLabel={intervalLabel}
                displayPriceCents={displayPrice(plan)}
                featured={featured}
                cta={
                  featured ? (
                    <button
                      type="button"
                      disabled={checkoutPlanSlug === plan.slug}
                      className={cn(
                        buttonVariants({ size: 'lg' }),
                        'h-11 w-full rounded-full',
                      )}
                      onClick={() => {
                        void startCheckout(plan.slug);
                      }}
                    >
                      {checkoutPlanSlug === plan.slug ? 'Processing…' : 'Get started'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={checkoutPlanSlug === plan.slug}
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'lg' }),
                        'h-11 w-full rounded-full border-[var(--border)] bg-transparent',
                      )}
                      onClick={() => {
                        void startCheckout(plan.slug);
                      }}
                    >
                      {checkoutPlanSlug === plan.slug ? 'Processing…' : 'Get started'}
                    </button>
                  )
                }
              />
            );
          })}
        </div>
      )}

      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 p-6 shadow-sm backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Have a coupon?</h3>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Apply a code to preview discounted prices. Payment requires a signed-in account.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Coupon code"
            className={formControlClass}
            aria-label="Coupon code"
          />
          <button
            type="button"
            disabled={couponPending}
            className={cn(buttonVariants({ variant: 'outline' }), 'h-11 shrink-0 rounded-full px-6')}
            onClick={() => {
              void applyCoupon();
            }}
          >
            {couponPending ? 'Applying…' : 'Apply'}
          </button>
        </div>
        {couponState ? (
          <p className="mt-3 text-sm font-medium text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]">
            {couponState.code} applied
            {couponState.discountLabel ? ` (${couponState.discountLabel})` : ''}.
          </p>
        ) : null}
        {couponError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {couponError}
          </p>
        ) : null}
        {!user ? (
          <p className="mt-4 text-center text-sm text-[var(--muted-foreground)]">
            Already have an account?{' '}
            <Link href="/login?next=%2Fsubscribe" className="font-medium text-[var(--primary)] hover:underline">
              Sign in
            </Link>{' '}
            to complete checkout.
          </p>
        ) : null}
      </div>
    </div>
  );
}
