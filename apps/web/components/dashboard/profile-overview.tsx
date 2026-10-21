import type { PublicUser } from '@/lib/auth-api';
import { userDisplayLabel } from '@/lib/user-display';

type ProfileOverviewProps = {
  user: PublicUser;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 shadow-sm">
      <dt className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{value}</dd>
    </div>
  );
}

export function ProfileOverview({ user }: ProfileOverviewProps) {
  const accountType = user.isGuest ? 'Guest' : 'Member';
  const displayName = userDisplayLabel(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Profile</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Your account details and membership status.
        </p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Display name" value={displayName} />
        {user.hasVerifiedEmail || user.email ? (
          <Field
            label="Email"
            value={
              user.hasVerifiedEmail ? (user.email ?? '—') : `${user.email ?? '—'} (not verified)`
            }
          />
        ) : null}
        <Field label="Username" value={user.username ?? '—'} />
        <Field label="Account type" value={accountType} />
        <Field label="Role" value={user.role} />
        <Field label="Status" value={user.status} />
      </dl>
    </div>
  );
}
