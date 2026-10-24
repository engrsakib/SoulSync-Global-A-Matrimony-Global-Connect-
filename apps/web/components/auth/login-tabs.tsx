'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import { GuestCreatePanel } from '@/components/auth/guest-create-panel';
import { GuestLoginForm } from '@/components/auth/guest-login-form';
import { LoginForm } from '@/components/auth/login-form';

type TabId = 'account' | 'guest';

export function LoginTabs() {
  const [tab, setTab] = React.useState<TabId>('account');
  const [guestMode, setGuestMode] = React.useState<'login' | 'create'>('login');

  return (
    <div className="space-y-6">
      <div
        className="flex rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-1"
        role="tablist"
        aria-label="Login mode"
      >
        {(
          [
            { id: 'account' as const, label: 'Account' },
            { id: 'guest' as const, label: 'Guest' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={cn(
              'flex-1 rounded-md py-2.5 text-sm font-medium transition-colors',
              tab === item.id
                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'account' ? (
        <LoginForm />
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className={cn(
                'rounded-full px-3 py-1.5 font-medium',
                guestMode === 'login'
                  ? 'bg-[var(--color-brand-600)]/10 text-[var(--color-brand-600)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
              onClick={() => setGuestMode('login')}
            >
              I have a code
            </button>
            <button
              type="button"
              className={cn(
                'rounded-full px-3 py-1.5 font-medium',
                guestMode === 'create'
                  ? 'bg-[var(--color-brand-600)]/10 text-[var(--color-brand-600)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              )}
              onClick={() => setGuestMode('create')}
            >
              New guest code
            </button>
          </div>
          {guestMode === 'login' ? <GuestLoginForm /> : <GuestCreatePanel />}
        </div>
      )}
    </div>
  );
}
