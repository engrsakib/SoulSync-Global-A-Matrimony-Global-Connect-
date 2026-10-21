'use client';

import { useMemo, useState } from 'react';
import type { CommunityDto } from '@soulsync/shared-types/communities';
import { cn } from '@soulsync/ui/lib/utils';
import { CommunityCard } from './community-card';
import { CreateCommunityForm } from './create-community-form';
import { isActiveMember } from '@/lib/communities-format';

type TabId = 'all' | 'joined' | 'discover';

type CommunitiesDirectoryProps = {
  initialCommunities: CommunityDto[] | null;
  loadFailed: boolean;
};

export function CommunitiesDirectory({ initialCommunities, loadFailed }: CommunitiesDirectoryProps) {
  const [communities, setCommunities] = useState<CommunityDto[]>(initialCommunities ?? []);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabId>('all');

  const filtered = useMemo(() => {
    let list = communities;
    if (tab === 'joined') {
      list = list.filter((c) => isActiveMember(c));
    } else if (tab === 'discover') {
      list = list.filter((c) => !isActiveMember(c));
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false),
    );
  }, [communities, query, tab]);

  function upsertCommunity(updated: CommunityDto) {
    setCommunities((prev) => {
      const idx = prev.findIndex((c) => c.id === updated.id);
      if (idx === -1) {
        return [updated, ...prev];
      }
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'all', label: 'All communities' },
    { id: 'joined', label: 'Yours' },
    { id: 'discover', label: 'Discover' },
  ];

  return (
    <div className="space-y-6">
      {loadFailed ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Could not load groups. Ensure the API is running and migrations are applied (
          <code className="text-xs">pnpm --filter @soulsync/db db:deploy</code>).
        </div>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search communities…"
          className="h-10 w-full max-w-md rounded-full border border-[var(--border)] bg-[var(--background)] px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
        />
        <CreateCommunityForm onCreated={(c) => setCommunities((prev) => [c, ...prev])} />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-[var(--color-brand-700)] text-white'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center">
          <p className="font-medium">No communities here yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {tab === 'joined'
              ? 'Join or create a community to see it under Yours.'
              : 'Create the first community for your tenant.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onMembershipChange={upsertCommunity}
            />
          ))}
        </div>
      )}
    </div>
  );
}
