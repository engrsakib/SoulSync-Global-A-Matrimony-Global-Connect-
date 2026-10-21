import type { PublicUser } from '@/lib/auth-api';
import { dashboardPageTitle } from '@/lib/ui-classes';
import { userDisplayLabel } from '@/lib/user-display';
import { DashboardCard } from './dashboard-card';
import { ProfileAvatar } from './profile-avatar';

type ProfileOverviewProps = {
  user: PublicUser;
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value}</p>
    </div>
  );
}

export function ProfileOverview({ user }: ProfileOverviewProps) {
  const accountType = user.isGuest ? 'Guest' : 'Member';
  const displayName = userDisplayLabel(user);
  const emailDisplay =
    user.hasVerifiedEmail && user.email
      ? user.email
      : user.email
        ? `${user.email} (not verified)`
        : '—';
  const locationLine = user.username ? `@${user.username}` : '—';

  return (
    <div className="space-y-6">
      <h1 className={dashboardPageTitle}>My Profile</h1>

      <section className="flex flex-col gap-4 rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-6 shadow-sm sm:flex-row sm:items-center">
        <ProfileAvatar user={user} size="lg" />
        <div className="min-w-0">
          <p className="text-xl font-bold text-[var(--foreground)]">{displayName}</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-brand-700)]">{user.role}</p>
          <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
            {accountType} · {locationLine}
          </p>
        </div>
      </section>

      <DashboardCard title="Personal information" editHref="/profile/settings">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="First name" value={user.firstName ?? '—'} />
          <InfoField label="Last name" value={user.lastName ?? '—'} />
          <InfoField label="Email address" value={emailDisplay} />
          <InfoField label="Username" value={user.username ?? '—'} />
          <InfoField label="Phone number" value="—" />
          <InfoField label="User role" value={user.role} />
        </div>
      </DashboardCard>

      <DashboardCard title="Account & security" editHref="/profile/settings#password">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Account type" value={accountType} />
          <InfoField label="Status" value={user.status} />
          <InfoField label="Password" value={user.hasPassword ? 'Set' : 'Not set'} />
          <InfoField label="Email verified" value={user.hasVerifiedEmail ? 'Yes' : 'No'} />
        </div>
      </DashboardCard>
    </div>
  );
}
