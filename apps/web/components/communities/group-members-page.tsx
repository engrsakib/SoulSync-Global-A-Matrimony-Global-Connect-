'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {
  CommunityDto,
  CommunityMemberDto,
  CommunityMemberRoleDto,
} from '@soulsync/shared-types/communities';
import { canModerateCommunity } from '@soulsync/shared-types/communities';
import { Input } from '@soulsync/ui/input';
import { Button } from '@soulsync/ui/button';
import { Card, CardContent } from '@soulsync/ui/card';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { cn } from '@soulsync/ui/lib/utils';
import {
  fetchCommunityMembers,
  fetchJoinRequests,
  patchCommunityMember,
  removeCommunityMember,
} from '@/lib/communities-client';
import {
  formatCommunityAuthorUsername,
  formatJoinedDate,
  isActiveMember,
  isCommunityTeamRole,
  sortCommunityMembers,
  viewerIsCommunityAdmin,
} from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';
import { GroupHeader } from './group-header';
import { CommunityGroupNav } from './community-group-nav';
import { CommunityRoleBadge } from './community-role-badge';
import { MembershipActions } from './membership-actions';
import { CommunityJoinRequestsPanel } from './community-join-requests-panel';
import { toast } from 'sonner';

type MemberTab = 'all' | 'team' | 'requested';

type GroupMembersPageProps = {
  initialCommunity: CommunityDto;
};

export function GroupMembersPage({ initialCommunity }: GroupMembersPageProps) {
  const [community, setCommunity] = useState(initialCommunity);
  const [members, setMembers] = useState<CommunityMemberDto[]>([]);
  const [loading, setLoading] = useState(isActiveMember(community));
  const [tab, setTab] = useState<MemberTab>('all');
  const [query, setQuery] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [pendingJoinCount, setPendingJoinCount] = useState(0);

  const member = isActiveMember(community);
  const isAdmin = viewerIsCommunityAdmin(community.viewerMembership);
  const canReviewJoinRequests =
    member &&
    community.viewerMembership != null &&
    canModerateCommunity(community.viewerMembership.role);

  const memberTabs = useMemo(() => {
    const tabs: { key: MemberTab; label: string }[] = [
      { key: 'all', label: 'All members' },
      { key: 'team', label: 'Team' },
    ];
    if (canReviewJoinRequests && pendingJoinCount > 0) {
      tabs.push({
        key: 'requested',
        label: `Requested (${pendingJoinCount})`,
      });
    }
    return tabs;
  }, [canReviewJoinRequests, pendingJoinCount]);

  const activeTab =
    tab === 'requested' && !(canReviewJoinRequests && pendingJoinCount > 0) ? 'all' : tab;

  useEffect(() => {
    if (!canReviewJoinRequests) {
      return;
    }
    let cancelled = false;
    void fetchJoinRequests(community.slug)
      .then((rows) => {
        if (!cancelled) {
          setPendingJoinCount(rows.length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPendingJoinCount(0);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [community.slug, canReviewJoinRequests]);

  useEffect(() => {
    if (!member) {
      return;
    }
    let cancelled = false;
    void fetchCommunityMembers(community.slug)
      .then((rows) => {
        if (!cancelled) {
          setMembers(sortCommunityMembers(rows));
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load members');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [community.slug, member]);

  const filtered = useMemo(() => {
    let list = members;
    if (activeTab === 'team') {
      list = list.filter((m) => isCommunityTeamRole(m.role));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((m) => m.username?.toLowerCase().includes(q));
    }
    return list;
  }, [members, activeTab, query]);

  async function handleRoleChange(userId: string, role: CommunityMemberRoleDto) {
    setBusyUserId(userId);
    try {
      const updated = await patchCommunityMember(community.slug, userId, { role });
      setMembers((prev) =>
        sortCommunityMembers(prev.map((m) => (m.userId === userId ? updated : m))),
      );
      toast.success('Member updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update member');
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleTrustedToggle(userId: string, isTrustedPoster: boolean) {
    setBusyUserId(userId);
    try {
      const updated = await patchCommunityMember(community.slug, userId, { isTrustedPoster });
      setMembers((prev) => prev.map((m) => (m.userId === userId ? updated : m)));
      toast.success(isTrustedPoster ? 'Marked as trusted poster' : 'Trusted poster removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update member');
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove(userId: string) {
    if (!window.confirm('Remove this member from the community?')) {
      return;
    }
    setBusyUserId(userId);
    try {
      await removeCommunityMember(community.slug, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success('Member removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove member');
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="space-y-6">
      <GroupHeader community={community} onCommunityUpdate={setCommunity} />
      <CommunityGroupNav community={community} memberCount={member ? members.length : null} />

      {!member ? (
        <Card className="mx-auto max-w-lg border-[var(--border)]/80 shadow-sm">
          <CardContent className="space-y-4 p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Join this community to see who&apos;s here and connect with members.
            </p>
            <MembershipActions community={community} onUpdated={setCommunity} />
          </CardContent>
        </Card>
      ) : (
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {memberTabs.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium',
                    activeTab === key
                      ? 'bg-[var(--color-brand-700)] text-white'
                      : 'bg-[var(--muted)] text-[var(--muted-foreground)]',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {activeTab !== 'requested' ? (
              <Input
                type="search"
                placeholder="Search by username"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="max-w-xs"
              />
            ) : null}
          </div>

          {activeTab === 'requested' ? (
            <CommunityJoinRequestsPanel
              slug={community.slug}
              variant="members"
              onPendingCountChange={setPendingJoinCount}
            />
          ) : loading ? (
            <p className="text-center text-sm text-[var(--muted-foreground)]">Loading members…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              {activeTab === 'team'
                ? 'No admins or moderators listed.'
                : 'No members match your search.'}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--border)]/80 overflow-hidden rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] shadow-sm">
              {filtered.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-11 w-11">
                      {row.avatarUrl ? (
                        <Image
                          src={row.avatarUrl}
                          alt=""
                          width={44}
                          height={44}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback>
                          {(row.username ?? '??').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      {row.username ? (
                        <Link
                          href={memberRoutes.communityMember(community.slug, row.username)}
                          className="font-medium hover:underline"
                        >
                          {formatCommunityAuthorUsername(row.username)}
                        </Link>
                      ) : (
                        <span className="font-medium">Member</span>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <CommunityRoleBadge role={row.role} />
                        {row.isTrustedPoster ? (
                          <span className="text-xs text-[var(--muted-foreground)]">
                            Trusted poster
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        Joined {formatJoinedDate(row.joinedAt)}
                      </p>
                    </div>
                  </div>

                  {isAdmin && row.role !== 'OWNER' ? (
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <select
                        value={row.role}
                        disabled={busyUserId === row.userId}
                        onChange={(e) =>
                          void handleRoleChange(
                            row.userId,
                            e.target.value as CommunityMemberRoleDto,
                          )
                        }
                        className="h-9 rounded-[var(--radius)] border border-[var(--border)] bg-transparent px-2 text-xs"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={row.isTrustedPoster}
                          disabled={busyUserId === row.userId}
                          onChange={(e) => void handleTrustedToggle(row.userId, e.target.checked)}
                        />
                        Trusted
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyUserId === row.userId}
                        onClick={() => void handleRemove(row.userId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
