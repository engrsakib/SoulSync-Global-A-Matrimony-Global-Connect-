'use client';

import * as React from 'react';
import Link from 'next/link';
import type {
  BiodataAccessRequestDto,
  BiodataAccessRequestListDto,
} from '@soulsync/shared-types/biodata-visibility';
import type { ProfileCompatibilityDto } from '@soulsync/shared-types/compatibility';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import {
  decideBiodataAccessRequest,
  fetchBiodataAccessRequests,
  fetchBiodataVisibilityPolicy,
} from '@/lib/biodata-visibility-api';
import { notifyBiodataAccessRequestsChanged } from '@/lib/biodata-access-request-events';
import { fetchProfileCompatibility } from '@/lib/compatibility-api';
import { formatRequesterLabel } from '@/lib/format-requester-display-name';
import {
  btnPrimaryMd,
  btnPrimaryOutlineMd,
  dashboardPageTitle,
  formControlClass,
} from '@/lib/ui-classes';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';
import { BiodataEditAccessPanel } from '@/components/dashboard/biodata-edit-access-panel';

type BiodataPermissionRequestsProps = {
  initialAccessRequests: BiodataAccessRequestListDto;
  initialSection?: 'view' | 'edit';
  initialPendingEditIncomingCount?: number;
  managedOwnerUserId?: string;
  hideEditSection?: boolean;
  pageTitle?: string;
  pageDescription?: string;
  backHref?: string;
  backLabel?: string;
};

type TabId = 'pending' | 'history';
type SectionId = 'view' | 'edit';

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function statusLabel(status: BiodataAccessRequestDto['status']): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'DENIED':
      return 'Denied';
    case 'REVOKED':
      return 'Revoked';
    case 'EXPIRED':
      return 'Expired';
    default:
      return status;
  }
}

function requesterInitials(requester: BiodataAccessRequestDto['requester']): string {
  const label = formatRequesterLabel(requester);
  const fromLabel = label
    .replace(/^@/, '')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
  if (fromLabel.length >= 2) {
    return fromLabel.toUpperCase();
  }
  return (requester.username?.slice(0, 2) ?? 'MB').toUpperCase();
}

function statusPillClass(status: BiodataAccessRequestDto['status']): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-700/10 text-emerald-900';
    case 'DENIED':
      return 'bg-red-500/10 text-red-800';
    case 'REVOKED':
    case 'EXPIRED':
      return 'bg-[var(--muted)] text-[var(--muted-foreground)]';
    default:
      return 'bg-amber-500/10 text-amber-900';
  }
}

export function BiodataPermissionRequests({
  initialAccessRequests,
  initialSection = 'view',
  initialPendingEditIncomingCount = 0,
  managedOwnerUserId,
  hideEditSection = false,
  pageTitle = 'Permission requests',
  pageDescription,
  backHref,
  backLabel,
}: BiodataPermissionRequestsProps) {
  const [section, setSection] = React.useState<SectionId>(
    hideEditSection ? 'view' : initialSection,
  );
  const [editPendingIncomingCount, setEditPendingIncomingCount] = React.useState(
    initialPendingEditIncomingCount,
  );
  const [tab, setTab] = React.useState<TabId>('pending');
  const [pendingRequests, setPendingRequests] = React.useState(
    () => initialAccessRequests.pending ?? [],
  );
  const [historyRequests, setHistoryRequests] = React.useState(
    () => initialAccessRequests.history ?? [],
  );
  const [queuePending, setQueuePending] = React.useState(false);

  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [approveForever, setApproveForever] = React.useState(true);
  const [approveUntil, setApproveUntil] = React.useState('');
  const [approveAudience, setApproveAudience] = React.useState<'requester' | 'everyone'>(
    'requester',
  );

  const [compatibilityByUserId, setCompatibilityByUserId] = React.useState<
    Map<string, ProfileCompatibilityDto | null>
  >(() => new Map());

  const refreshQueue = React.useCallback(async () => {
    const list = await fetchBiodataAccessRequests(managedOwnerUserId);
    setPendingRequests(list.pending);
    setHistoryRequests(list.history);
    notifyBiodataAccessRequestsChanged();
  }, [managedOwnerUserId]);

  const allRequesterIds = React.useMemo(() => {
    const ids = new Set<string>();
    for (const item of pendingRequests) {
      ids.add(item.requester.id);
    }
    for (const item of historyRequests) {
      ids.add(item.requester.id);
    }
    return [...ids];
  }, [pendingRequests, historyRequests]);

  React.useEffect(() => {
    if (allRequesterIds.length === 0) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const results = await Promise.allSettled(
        allRequesterIds.map((id) => fetchProfileCompatibility(id)),
      );
      if (cancelled) {
        return;
      }
      setCompatibilityByUserId((prev) => {
        const next = new Map(prev);
        allRequesterIds.forEach((id, index) => {
          const result = results[index];
          if (!result || result.status === 'rejected') {
            next.set(id, null);
            return;
          }
          next.set(id, result.value);
        });
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [allRequesterIds]);

  const denyRequest = async (requestId: string) => {
    setQueuePending(true);
    try {
      await decideBiodataAccessRequest(requestId, { decision: 'deny' }, managedOwnerUserId);
      await refreshQueue();
      toast.success('Request denied');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not deny request');
    } finally {
      setQueuePending(false);
    }
  };

  const submitApprove = async (requestId: string) => {
    setQueuePending(true);
    try {
      await decideBiodataAccessRequest(
        requestId,
        {
          decision: 'approve',
          audience: approveAudience,
          forever: approveForever,
          expiresAt: approveForever ? undefined : new Date(approveUntil).toISOString(),
        },
        managedOwnerUserId,
      );
      setApprovingId(null);
      if (approveAudience === 'everyone') {
        await fetchBiodataVisibilityPolicy(managedOwnerUserId);
      }
      await refreshQueue();
      toast.success('Access granted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not approve request');
    } finally {
      setQueuePending(false);
    }
  };

  const revokeGrant = async (requestId: string) => {
    setQueuePending(true);
    try {
      await decideBiodataAccessRequest(requestId, { decision: 'revoke' }, managedOwnerUserId);
      await refreshQueue();
      toast.success('Access revoked');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not revoke access');
    } finally {
      setQueuePending(false);
    }
  };

  const defaultViewDescription =
    'Review members who asked to view protected sections of your biodata. Approve or deny each request, and see how well you match before you decide.';
  const defaultEditDescription =
    'Manage who may edit your biodata on your behalf, or request access to help someone else.';

  return (
    <div className="space-y-6">
      <div>
        {backHref ? (
          <Link
            href={backHref}
            className="mb-2 inline-block text-sm font-medium text-[var(--color-brand-700)] hover:underline"
          >
            ← {backLabel ?? 'Back'}
          </Link>
        ) : null}
        <h1 className={dashboardPageTitle}>{pageTitle}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          {pageDescription ??
            (section === 'view' ? defaultViewDescription : defaultEditDescription)}
        </p>
      </div>

      {hideEditSection ? null : (
        <div
          className="inline-flex rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/30 p-1"
          role="tablist"
          aria-label="Permission type"
        >
          <TabButton
            active={section === 'view'}
            onClick={() => setSection('view')}
            count={pendingRequests.length}
          >
            View access
          </TabButton>
          <TabButton
            active={section === 'edit'}
            onClick={() => setSection('edit')}
            count={editPendingIncomingCount}
          >
            Edit access
          </TabButton>
        </div>
      )}

      {!hideEditSection && section === 'edit' ? (
        <BiodataEditAccessPanel onPendingIncomingCountChange={setEditPendingIncomingCount} />
      ) : null}

      {section === 'view' ? (
        <>
          <div
            className="inline-flex rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/30 p-1"
            role="tablist"
            aria-label="Request lists"
          >
            <TabButton
              active={tab === 'pending'}
              onClick={() => setTab('pending')}
              count={pendingRequests.length}
            >
              Pending
            </TabButton>
            <TabButton
              active={tab === 'history'}
              onClick={() => setTab('history')}
              count={historyRequests.length}
            >
              Recent decisions
            </TabButton>
          </div>

          {tab === 'pending' ? (
            pendingRequests.length === 0 ? (
              <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-8 text-center shadow-sm">
                <p className="text-sm font-medium text-[var(--foreground)]">No pending requests</p>
                <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
                  When a member asks to view a section that requires your approval, it will appear
                  here with their match score.
                </p>
              </section>
            ) : (
              <ul className="space-y-4">
                {pendingRequests.map((item) => (
                  <PendingRequestCard
                    key={item.id}
                    item={item}
                    queuePending={queuePending}
                    compatibility={compatibilityByUserId.get(item.requester.id) ?? null}
                    compatibilityLoading={!compatibilityByUserId.has(item.requester.id)}
                    approvingId={approvingId}
                    approveForever={approveForever}
                    approveUntil={approveUntil}
                    approveAudience={approveAudience}
                    onStartApprove={() => {
                      setApprovingId(item.id);
                      setApproveForever(true);
                      setApproveUntil('');
                      setApproveAudience('requester');
                    }}
                    onDeny={() => void denyRequest(item.id)}
                    onApproveForeverChange={setApproveForever}
                    onApproveUntilChange={setApproveUntil}
                    onApproveAudienceChange={setApproveAudience}
                    onCancelApprove={() => setApprovingId(null)}
                    onConfirmApprove={() => void submitApprove(item.id)}
                  />
                ))}
              </ul>
            )
          ) : historyRequests.length === 0 ? (
            <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-8 text-center shadow-sm">
              <p className="text-muted-foreground text-sm">No recent decisions yet.</p>
            </section>
          ) : (
            <ul className="space-y-3">
              {historyRequests.map((item) => (
                <HistoryRequestRow
                  key={item.id}
                  item={item}
                  queuePending={queuePending}
                  compatibility={compatibilityByUserId.get(item.requester.id) ?? null}
                  onRevoke={() => void revokeGrant(item.id)}
                />
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
          : 'text-muted-foreground hover:text-[var(--foreground)]',
      )}
      onClick={onClick}
    >
      {children}
      {count > 0 ? (
        <span
          className={cn(
            'min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold',
            active ? 'bg-[var(--color-brand-700)] text-white' : 'bg-[var(--muted)]',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  );
}

function isSameGenderIneligibleReason(reason: string | undefined): boolean {
  if (!reason) {
    return false;
  }
  const lower = reason.toLowerCase();
  return lower.includes('same gender') || lower.includes('opposite gender');
}

function isPreferencesIneligibleReason(reason: string | undefined): boolean {
  if (!reason) {
    return false;
  }
  const lower = reason.toLowerCase();
  return lower.includes('partner preferences') || lower.includes('matching preferences');
}

function CompatibilityMatchBadge({
  compatibility,
  loading,
  prominent = false,
}: {
  compatibility: ProfileCompatibilityDto | null;
  loading: boolean;
  prominent?: boolean;
}) {
  if (loading && compatibility === null) {
    return (
      <span
        className={cn(
          'animate-pulse rounded-full bg-[var(--muted)]/80',
          prominent ? 'h-7 w-20' : 'h-6 w-16',
        )}
        aria-hidden
      />
    );
  }
  if (!compatibility) {
    return null;
  }
  if (compatibility.eligible && compatibility.overallPercent != null) {
    return (
      <span
        className={cn(
          'shrink-0 rounded-full bg-emerald-700/10 font-semibold text-emerald-900',
          prominent ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs',
        )}
      >
        {compatibility.overallPercent}% match
      </span>
    );
  }
  if (isSameGenderIneligibleReason(compatibility.ineligibleReason)) {
    return <span className="text-muted-foreground shrink-0 text-xs">Match not available</span>;
  }
  if (isPreferencesIneligibleReason(compatibility.ineligibleReason)) {
    return (
      <span className="text-muted-foreground max-w-[12rem] shrink-0 text-right text-xs leading-snug">
        Complete partner preferences to see match
      </span>
    );
  }
  return null;
}

function PendingRequestCard({
  item,
  queuePending,
  compatibility,
  compatibilityLoading,
  approvingId,
  approveForever,
  approveUntil,
  approveAudience,
  onStartApprove,
  onDeny,
  onApproveForeverChange,
  onApproveUntilChange,
  onApproveAudienceChange,
  onCancelApprove,
  onConfirmApprove,
}: {
  item: BiodataAccessRequestDto;
  queuePending: boolean;
  compatibility: ProfileCompatibilityDto | null;
  compatibilityLoading: boolean;
  approvingId: string | null;
  approveForever: boolean;
  approveUntil: string;
  approveAudience: 'requester' | 'everyone';
  onStartApprove: () => void;
  onDeny: () => void;
  onApproveForeverChange: (value: boolean) => void;
  onApproveUntilChange: (value: string) => void;
  onApproveAudienceChange: (value: 'requester' | 'everyone') => void;
  onCancelApprove: () => void;
  onConfirmApprove: () => void;
}) {
  const { requester } = item;
  const displayLabel = formatRequesterLabel(requester);
  const initials = requesterInitials(requester);
  const biodataHref = requester.username
    ? `/biodata/${encodeURIComponent(requester.username.trim().toLowerCase())}`
    : null;
  const showUsernameLine =
    requester.username?.trim() && !displayLabel.startsWith(`@${requester.username.trim()}`);

  return (
    <li className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 via-[var(--background)] to-[var(--muted)]/15 shadow-sm">
      <div className="flex gap-4 p-5">
        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-white/80">
          <AvatarFallback className="bg-emerald-100/80 text-sm font-semibold text-emerald-900">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {biodataHref ? (
                <Link
                  href={biodataHref}
                  className="truncate text-base font-semibold text-[var(--foreground)] hover:underline"
                >
                  {displayLabel}
                </Link>
              ) : (
                <p className="truncate text-base font-semibold text-[var(--foreground)]">
                  {displayLabel}
                </p>
              )}
              {showUsernameLine ? (
                <p className="text-muted-foreground text-sm">@{requester.username}</p>
              ) : null}
            </div>
            <CompatibilityMatchBadge
              compatibility={compatibility}
              loading={compatibilityLoading}
              prominent
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-200/60 bg-white/60 px-2.5 py-0.5 font-medium text-emerald-950">
              {item.sectionTitle}
            </span>
            <span className="text-muted-foreground">{formatWhen(item.createdAt)}</span>
          </div>

          {item.message ? (
            <blockquote className="rounded-lg border border-[var(--border)]/60 bg-white/50 py-2 pr-3 pl-3 text-sm text-[var(--foreground)]/90">
              {item.message}
            </blockquote>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-emerald-200/40 bg-white/40 px-5 py-3">
        <button
          type="button"
          className={cn(btnPrimaryMd, 'min-w-[5.5rem]')}
          disabled={queuePending}
          onClick={onStartApprove}
        >
          Approve
        </button>
        <button
          type="button"
          className={btnPrimaryOutlineMd}
          disabled={queuePending}
          onClick={onDeny}
        >
          Deny
        </button>
        {biodataHref ? (
          <Link href={biodataHref} className={btnPrimaryOutlineMd}>
            View biodata
          </Link>
        ) : null}
      </div>

      {approvingId === item.id ? (
        <div className="space-y-4 border-t border-[var(--border)]/60 bg-[var(--muted)]/15 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Duration</Label>
              <SelectWithChevron
                label=""
                value={approveForever ? 'forever' : 'until'}
                onChange={(event) => onApproveForeverChange(event.target.value === 'forever')}
                className="mt-1"
              >
                <option value="forever">Forever</option>
                <option value="until">Until date & time</option>
              </SelectWithChevron>
            </div>
            {!approveForever ? (
              <div>
                <Label className="text-xs">Access until</Label>
                <input
                  type="datetime-local"
                  className={cn(formControlClass, 'mt-1')}
                  value={approveUntil}
                  onChange={(event) => onApproveUntilChange(event.target.value)}
                />
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <Label className="text-xs">Grant access to</Label>
              <SelectWithChevron
                label=""
                value={approveAudience}
                onChange={(event) =>
                  onApproveAudienceChange(event.target.value as 'requester' | 'everyone')
                }
                className="mt-1"
              >
                <option value="requester">This member only</option>
                <option value="everyone">All members (section becomes visible to everyone)</option>
              </SelectWithChevron>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnPrimaryMd}
              disabled={queuePending || (!approveForever && !approveUntil)}
              onClick={onConfirmApprove}
            >
              Confirm approval
            </button>
            <button type="button" className={btnPrimaryOutlineMd} onClick={onCancelApprove}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function HistoryRequestRow({
  item,
  queuePending,
  compatibility,
  onRevoke,
}: {
  item: BiodataAccessRequestDto;
  queuePending: boolean;
  compatibility: ProfileCompatibilityDto | null;
  onRevoke: () => void;
}) {
  const { requester } = item;
  const displayLabel = formatRequesterLabel(requester);
  const initials = requesterInitials(requester);
  const biodataHref = requester.username
    ? `/biodata/${encodeURIComponent(requester.username.trim().toLowerCase())}`
    : null;

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--border)]/80 bg-[var(--background)] px-4 py-3 shadow-sm">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarFallback className="bg-[var(--muted)] text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {biodataHref ? (
            <Link href={biodataHref} className="text-sm font-semibold hover:underline">
              {displayLabel}
            </Link>
          ) : (
            <span className="text-sm font-semibold">{displayLabel}</span>
          )}
          <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">
            {item.sectionTitle}
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              statusPillClass(item.status),
            )}
          >
            {statusLabel(item.status)}
          </span>
          <CompatibilityMatchBadge compatibility={compatibility} loading={false} />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {item.expiresAt ? `Until ${formatWhen(item.expiresAt)} · ` : ''}
          {item.decidedAt ? `Decided ${formatWhen(item.decidedAt)}` : formatWhen(item.createdAt)}
        </p>
      </div>
      {item.status === 'APPROVED' ? (
        <button
          type="button"
          className={btnPrimaryOutlineMd}
          disabled={queuePending}
          onClick={onRevoke}
        >
          Revoke
        </button>
      ) : null}
    </li>
  );
}
