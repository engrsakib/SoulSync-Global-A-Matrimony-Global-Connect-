'use client';

import type { CreditWalletSummaryDto } from '@soulsync/shared-types/credits';
import type { PublicUser } from '@/lib/auth-api';
import { useCurrentUser } from '@/hooks/use-current-user';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { dashboardPageTitle } from '@/lib/ui-classes';
import { DashboardCard } from './dashboard-card';
import { ProfileHeroCard } from './profile-hero-card';
import { ProfileLoginCodeField } from './profile-login-code-field';

type ProfileOverviewProps = {
  initialUser: PublicUser;
  initialWalletSummary?: CreditWalletSummaryDto | null;
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export function ProfileOverview({ initialUser, initialWalletSummary }: ProfileOverviewProps) {
  const { user: liveUser, loading } = useCurrentUser();
  const user = liveUser ?? initialUser;

  const accountType = user.isGuest ? 'Guest' : 'Member';
  const emailDisplay =
    user.hasVerifiedEmail && user.email
      ? user.email
      : user.email
        ? `${user.email} (not verified)`
        : '—';

  return (
    <div className="space-y-6">
      <h1 className={dashboardPageTitle}>My Profile</h1>

      {loading && !liveUser ? (
        <p className="text-sm text-[var(--muted-foreground)]">Refreshing profile…</p>
      ) : null}

      <ProfileHeroCard user={user} walletSummary={initialWalletSummary} />

      <DashboardCard title="Personal information" editHref={dashboardRoutes.settings}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="First name" value={user.firstName?.trim() || '—'} />
          <InfoField label="Last name" value={user.lastName?.trim() || '—'} />
          <InfoField label="Email address" value={emailDisplay} />
          <InfoField label="Username" value={user.username ?? '—'} />
          <InfoField label="Phone number" value="—" />
          <InfoField label="User role" value={user.role} />
        </div>
      </DashboardCard>

      <DashboardCard title="Account & security" editHref={`${dashboardRoutes.settings}#password`}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Account type" value={accountType} />
          <InfoField label="Status" value={user.status} />
          <InfoField label="Password" value={user.hasPassword ? 'Set' : 'Not set'} />
          <InfoField label="Email verified" value={user.hasVerifiedEmail ? 'Yes' : 'No'} />
          <ProfileLoginCodeField userId={user.id} loginCodeFromServer={user.loginCode} />
        </div>
      </DashboardCard>
    </div>
  );
}
