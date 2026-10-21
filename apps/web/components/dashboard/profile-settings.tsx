'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  generateStrongPassword,
  normalizeUsername,
  validatePassword,
  validateUsername,
} from '@soulsync/shared-types';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { UsernameField, type UsernameAvailabilityState } from '@/components/auth/username-field';
import { PasswordInput } from '@/components/auth/password-input';
import { PasswordStrength } from '@/components/auth/password-strength';
import {
  updateAccountPassword,
  updateAccountProfile,
  updateAccountUsername,
} from '@/lib/account-api';
import type { PublicUser } from '@/lib/auth-api';
import { notifyAuthSessionChanged } from '@/lib/auth-session';
import { EmailSettingsDialog } from '@/components/dashboard/email-settings-dialog';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { btnPrimaryMd, btnPrimaryOutline, dashboardPageTitle } from '@/lib/ui-classes';
import { userDisplayLabel } from '@/lib/user-display';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const primaryButtonClass = btnPrimaryMd;

type ProfileSettingsProps = {
  user: PublicUser;
};

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const router = useRouter();

  const [firstName, setFirstName] = React.useState(() => user.firstName ?? '');
  const [lastName, setLastName] = React.useState(() => user.lastName ?? '');
  const [namePending, setNamePending] = React.useState(false);

  const [username, setUsername] = React.useState(() => user.username ?? '');
  const [usernameState, setUsernameState] = React.useState<UsernameAvailabilityState>({
    valid: false,
    checking: false,
    available: null,
  });
  const [usernamePending, setUsernamePending] = React.useState(false);

  const [hasPassword, setHasPassword] = React.useState(user.hasPassword);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [passwordPending, setPasswordPending] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [emailDialogMode, setEmailDialogMode] = React.useState<'set' | 'change'>('set');

  const nameDirty =
    firstName.trim() !== (user.firstName ?? '').trim() ||
    lastName.trim() !== (user.lastName ?? '').trim();
  const nameCanSave =
    nameDirty && (firstName.trim().length > 0 || lastName.trim().length > 0) && !namePending;

  const usernameValidation = validateUsername(username);
  const usernameNormalized = normalizeUsername(username);
  const savedUsernameNorm = user.username ? normalizeUsername(user.username) : '';
  const usernameDirty = usernameNormalized !== savedUsernameNorm;
  const usernameCanSave =
    usernameDirty &&
    usernameValidation.valid &&
    usernameState.available === true &&
    !usernameState.checking &&
    !usernamePending;

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const passwordCanSave = hasPassword
    ? currentPassword.length > 0 && passwordValidation.valid && passwordsMatch && !passwordPending
    : passwordValidation.valid && passwordsMatch && !passwordPending;

  const refreshSession = () => {
    notifyAuthSessionChanged();
    router.refresh();
  };

  const suggestStrongPassword = () => {
    const suggested = generateStrongPassword();
    setNewPassword(suggested);
    setConfirmPassword(suggested);
    setPasswordError(null);
    toast.message('Strong password generated — save it somewhere safe before submitting.');
  };

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nameCanSave) {
      return;
    }
    setNamePending(true);
    try {
      await updateAccountProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      toast.success('Display name updated');
      refreshSession();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update name');
    } finally {
      setNamePending(false);
    }
  };

  const saveUsername = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!usernameCanSave) {
      return;
    }
    setUsernamePending(true);
    try {
      await updateAccountUsername({ username: usernameNormalized });
      toast.success('Username updated');
      refreshSession();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update username');
    } finally {
      setUsernamePending(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (!passwordCanSave) {
      return;
    }
    setPasswordPending(true);
    const changingExisting = hasPassword;
    try {
      const updated = await updateAccountPassword({
        newPassword,
        confirmPassword,
        ...(hasPassword ? { currentPassword } : {}),
      });
      setHasPassword(updated.hasPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(changingExisting ? 'Password updated' : 'Password set');
      refreshSession();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update password';
      setPasswordError(message);
      toast.error(message);
    } finally {
      setPasswordPending(false);
    }
  };

  const accountType = user.isGuest ? 'Guest' : 'Member';

  return (
    <div className="space-y-6">
      <div>
        <h1 className={dashboardPageTitle}>Profile settings</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Manage your account details, username, and password.
        </p>
      </div>

      <DashboardCard title="Account">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
              Signed in as
            </dt>
            <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">
              {userDisplayLabel(user)}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
              Email
            </dt>
            <dd className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-[var(--foreground)]">
                {user.hasVerifiedEmail
                  ? user.email
                  : user.email
                    ? `${user.email} (not verified)`
                    : 'No email on file'}
              </span>
              <button
                type="button"
                className={cn(primaryButtonClass, 'h-9 px-4 text-xs')}
                onClick={() => {
                  if (user.hasVerifiedEmail) {
                    setEmailDialogMode('change');
                  } else {
                    setEmailDialogMode('set');
                  }
                  setEmailDialogOpen(true);
                }}
              >
                {user.hasVerifiedEmail ? 'Change email' : user.email ? 'Verify email' : 'Set email'}
              </button>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
              Account type
            </dt>
            <dd className="mt-1">
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                  user.isGuest
                    ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
                    : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
                )}
              >
                {accountType}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
              Status
            </dt>
            <dd className="mt-1 text-sm font-medium text-[var(--foreground)]">{user.status}</dd>
          </div>
        </dl>
      </DashboardCard>

      <DashboardCard title="Display name">
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          Your name appears in the dashboard and header.
        </p>
        <form
          onSubmit={(event) => {
            void saveName(event);
          }}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                maxLength={64}
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                maxLength={64}
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className={primaryButtonClass} disabled={!nameCanSave}>
            {namePending ? 'Saving…' : 'Save name'}
          </button>
        </form>
      </DashboardCard>

      <DashboardCard title="Username">
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          {user.username
            ? 'Your public handle. Changing it updates how others find you.'
            : 'Claim a username to personalize your profile and sign-in options.'}
        </p>
        <form
          onSubmit={(event) => {
            void saveUsername(event);
          }}
          className="space-y-4"
        >
          <UsernameField
            value={username}
            onChange={setUsername}
            onAvailabilityChange={setUsernameState}
            forAccount
            currentUsername={user.username}
            required={false}
            disabled={usernamePending}
          />
          <button type="submit" className={primaryButtonClass} disabled={!usernameCanSave}>
            {usernamePending ? 'Saving…' : 'Save username'}
          </button>
        </form>
      </DashboardCard>

      <DashboardCard title={hasPassword ? 'Change password' : 'Set password'}>
        <div id="password" className="scroll-mt-24" />
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          {hasPassword
            ? 'Use a strong password you do not use elsewhere.'
            : 'Create a password so you can sign in with email or username, not only your guest code.'}
        </p>
        <form
          onSubmit={(event) => {
            void savePassword(event);
          }}
          className="space-y-4"
        >
          {hasPassword ? (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <PasswordInput
                id="currentPassword"
                name="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={setCurrentPassword}
                disabled={passwordPending}
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="newPassword">{hasPassword ? 'New password' : 'Password'}</Label>
              <button
                type="button"
                className={cn(btnPrimaryOutline, 'h-9 px-3 text-xs')}
                disabled={passwordPending}
                onClick={suggestStrongPassword}
              >
                Suggest strong password
              </button>
            </div>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={setNewPassword}
              disabled={passwordPending}
            />
            <PasswordStrength password={newPassword} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={passwordPending}
            />
            {confirmPassword.length > 0 && !passwordsMatch ? (
              <p className="text-xs text-red-600">Passwords do not match.</p>
            ) : null}
          </div>
          {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
          <button type="submit" className={primaryButtonClass} disabled={!passwordCanSave}>
            {passwordPending ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}
          </button>
        </form>
      </DashboardCard>

      <EmailSettingsDialog
        open={emailDialogOpen}
        mode={emailDialogMode}
        initialEmail={user.email ?? ''}
        currentEmail={user.email ?? undefined}
        onClose={() => setEmailDialogOpen(false)}
        onSuccess={() => refreshSession()}
      />
    </div>
  );
}
