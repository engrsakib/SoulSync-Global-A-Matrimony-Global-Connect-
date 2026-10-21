'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CreditWalletSummaryDto } from '@soulsync/shared-types/credits';
import type { PublicUser } from '@/lib/auth-api';
import { notifyAuthSessionChanged } from '@/lib/auth-session';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { userDisplayLabel } from '@/lib/user-display';
import { AvatarUploadDialog } from './avatar-upload-dialog';
import { ProfileAvatarUploadTrigger } from './profile-avatar-upload-trigger';

type ProfileHeroCardProps = {
  user: PublicUser;
  walletSummary?: CreditWalletSummaryDto | null;
};

export function ProfileHeroCard({ user, walletSummary }: ProfileHeroCardProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const accountType = user.isGuest ? 'Guest' : 'Member';
  const displayName = userDisplayLabel(user);
  const locationLine = user.username ? `@${user.username}` : '—';

  const handleUploadSuccess = () => {
    notifyAuthSessionChanged();
    router.refresh();
  };

  return (
    <>
      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-col items-start gap-3 sm:items-center">
            <ProfileAvatarUploadTrigger user={user} onClick={() => setDialogOpen(true)} />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-[var(--foreground)]">{displayName}</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-brand-700)]">{user.role}</p>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
              {accountType} · {locationLine}
            </p>
          </div>
        </div>
        {walletSummary !== undefined ? (
          <div className="shrink-0 rounded-xl border border-[var(--border)]/60 bg-[var(--muted)]/20 px-4 py-3 text-left sm:text-right">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Points balance</p>
            <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">
              {walletSummary?.balance ?? 0}
            </p>
            <Link
              href={dashboardRoutes.profileTransactions}
              className="mt-1 inline-block text-sm font-medium text-[var(--color-brand-700)] hover:underline"
            >
              View history
            </Link>
          </div>
        ) : null}
      </section>

      <AvatarUploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}
