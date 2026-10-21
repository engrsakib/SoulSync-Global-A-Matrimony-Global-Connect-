'use client';

import Link from 'next/link';
import * as React from 'react';
import type { CreditTransactionListDto } from '@soulsync/shared-types/credits';
import {
  effectiveCheckInTimeZone,
} from '@soulsync/shared-types/check-in';
import {
  formatCreditTransactionTime,
  formatSignedPoints,
} from '@soulsync/shared-types/credits';
import { toast } from 'sonner';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { fetchWalletTransactions } from '@/lib/wallet-api';
import { btnPrimaryOutline, dashboardPageTitle } from '@/lib/ui-classes';
import { DashboardCard } from './dashboard-card';

type ProfileTransactionsProps = {
  initialData: CreditTransactionListDto;
};

export function ProfileTransactions({ initialData }: ProfileTransactionsProps) {
  const [data, setData] = React.useState(initialData);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const timeZoneLabel = effectiveCheckInTimeZone(data.checkInTimeZone);

  const loadMore = async () => {
    if (!data.nextCursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const next = await fetchWalletTransactions({ cursor: data.nextCursor });
      setData((prev) => ({
        ...next,
        items: [...prev.items, ...next.items],
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load more');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={dashboardRoutes.profile}
            className="text-sm font-medium text-[var(--color-brand-700)] hover:underline"
          >
            ← Back to profile
          </Link>
          <h1 className={`${dashboardPageTitle} mt-2`}>Points history</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Times shown in {timeZoneLabel}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)]/80 bg-[var(--background)] px-4 py-3 text-right shadow-sm">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Current balance</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{data.balance} points</p>
        </div>
      </div>

      <DashboardCard title="Earn & spend">
        {data.items.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No transactions yet. Check in daily from the site header to earn points.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60">
            {data.items.map((tx) => {
              const positive = tx.signedAmount > 0;
              const zero = tx.signedAmount === 0;
              return (
                <li
                  key={tx.id}
                  className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">{tx.description}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatCreditTransactionTime(tx.createdAt, data.checkInTimeZone)}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold tabular-nums sm:text-base ${
                      zero
                        ? 'text-[var(--muted-foreground)]'
                        : positive
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {formatSignedPoints(tx.signedAmount)} pts
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        {data.nextCursor ? (
          <div className="mt-4 border-t border-[var(--border)]/60 pt-4">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className={btnPrimaryOutline}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        ) : null}
      </DashboardCard>
    </div>
  );
}
