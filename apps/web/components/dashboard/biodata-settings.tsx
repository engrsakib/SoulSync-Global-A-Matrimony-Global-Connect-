'use client';

import * as React from 'react';
import type {
  BiodataAccessRequestDto,
  BiodataAccessRequestListDto,
  BiodataSectionVisibilityMode,
  BiodataSectionVisibilityRowDto,
  BiodataVisibilityPolicyDto,
} from '@soulsync/shared-types/biodata-visibility';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import {
  decideBiodataAccessRequest,
  fetchBiodataAccessRequests,
  fetchBiodataVisibilityPolicy,
  patchBiodataVisibilityPolicy,
} from '@/lib/biodata-visibility-api';
import { btnPrimaryMd, btnPrimaryOutline, dashboardPageTitle } from '@/lib/ui-classes';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';

type BiodataSettingsProps = {
  initialPolicy: BiodataVisibilityPolicyDto;
  initialAccessRequests: BiodataAccessRequestListDto;
};

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

export function BiodataSettings({
  initialPolicy,
  initialAccessRequests,
}: BiodataSettingsProps) {
  const [sections, setSections] = React.useState(() => initialPolicy.sections);
  const [policyDirty, setPolicyDirty] = React.useState(false);
  const [policyPending, setPolicyPending] = React.useState(false);

  const [pending, setPending] = React.useState(() => initialAccessRequests.pending);
  const [history, setHistory] = React.useState(() => initialAccessRequests.history);
  const [queuePending, setQueuePending] = React.useState(false);

  const [approvingId, setApprovingId] = React.useState<string | null>(null);
  const [approveForever, setApproveForever] = React.useState(true);
  const [approveUntil, setApproveUntil] = React.useState('');
  const [approveAudience, setApproveAudience] = React.useState<'requester' | 'everyone'>(
    'requester',
  );

  const refreshQueue = React.useCallback(async () => {
    const list = await fetchBiodataAccessRequests();
    setPending(list.pending);
    setHistory(list.history);
  }, []);

  const setSectionMode = (sectionId: string, mode: BiodataSectionVisibilityMode) => {
    setSections((prev) =>
      prev.map((row) => (row.sectionId === sectionId ? { ...row, mode } : row)),
    );
    setPolicyDirty(true);
  };

  const savePolicy = async () => {
    setPolicyPending(true);
    try {
      const configurable = sections.filter((row) => !row.locked);
      const policy = await patchBiodataVisibilityPolicy({
        sections: configurable.map((row) => ({
          sectionId: row.sectionId,
          mode: row.mode,
        })),
      });
      setSections(policy.sections);
      setPolicyDirty(false);
      toast.success('Visibility settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save settings');
    } finally {
      setPolicyPending(false);
    }
  };

  const denyRequest = async (requestId: string) => {
    setQueuePending(true);
    try {
      await decideBiodataAccessRequest(requestId, { decision: 'deny' });
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
      await decideBiodataAccessRequest(requestId, {
        decision: 'approve',
        audience: approveAudience,
        forever: approveForever,
        expiresAt: approveForever ? undefined : new Date(approveUntil).toISOString(),
      });
      setApprovingId(null);
      if (approveAudience === 'everyone') {
        const policy = await fetchBiodataVisibilityPolicy();
        setSections(policy.sections);
        setPolicyDirty(false);
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
      await decideBiodataAccessRequest(requestId, { decision: 'revoke' });
      await refreshQueue();
      toast.success('Access revoked');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not revoke access');
    } finally {
      setQueuePending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={dashboardPageTitle}>Biodata settings</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          Choose which sections members can see directly and review permission requests. Personal
          details are always public. These rules apply when public biodata viewing is enabled.
        </p>
      </div>

      <DashboardCard title="Who can see each section">
        <ul className="divide-y divide-[var(--border)]/60">
          {sections.map((row) => (
            <SectionVisibilityRow key={row.sectionId} row={row} onModeChange={setSectionMode} />
          ))}
        </ul>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className={btnPrimaryMd}
            disabled={!policyDirty || policyPending}
            onClick={() => void savePolicy()}
          >
            {policyPending ? 'Saving…' : 'Save visibility'}
          </button>
        </div>
      </DashboardCard>

      <DashboardCard title="Permission queue">
        {pending.length === 0 ? (
          <p className="text-muted-foreground text-sm">No access requests yet.</p>
        ) : (
          <ul className="space-y-4">
            {pending.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/20 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {item.requester.displayName}
                      {item.requester.username ? (
                        <span className="text-muted-foreground font-normal">
                          {' '}
                          @{item.requester.username}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {item.sectionTitle} · {formatWhen(item.createdAt)}
                    </p>
                    {item.message ? (
                      <p className="mt-2 text-sm text-[var(--foreground)]">{item.message}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={btnPrimaryMd}
                      disabled={queuePending}
                      onClick={() => {
                        setApprovingId(item.id);
                        setApproveForever(true);
                        setApproveUntil('');
                        setApproveAudience('requester');
                      }}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={btnPrimaryOutline}
                      disabled={queuePending}
                      onClick={() => void denyRequest(item.id)}
                    >
                      Deny
                    </button>
                  </div>
                </div>

                {approvingId === item.id ? (
                  <div className="mt-4 space-y-4 border-t border-[var(--border)]/60 pt-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Duration</Label>
                        <SelectWithChevron
                          label=""
                          value={approveForever ? 'forever' : 'until'}
                          onChange={(event) =>
                            setApproveForever(event.target.value === 'forever')
                          }
                          className="mt-1"
                        >
                          <option value="forever">Forever</option>
                          <option value="until">Until a specific date</option>
                        </SelectWithChevron>
                      </div>
                      {!approveForever ? (
                        <div>
                          <Label className="text-xs">Access until</Label>
                          <input
                            type="datetime-local"
                            className="mt-1 flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm"
                            value={approveUntil}
                            onChange={(event) => setApproveUntil(event.target.value)}
                          />
                        </div>
                      ) : null}
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Grant access to</Label>
                        <SelectWithChevron
                          label=""
                          value={approveAudience}
                          onChange={(event) =>
                            setApproveAudience(event.target.value as 'requester' | 'everyone')
                          }
                          className="mt-1"
                        >
                          <option value="requester">This member only</option>
                          <option value="everyone">All members (section becomes direct)</option>
                        </SelectWithChevron>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnPrimaryMd}
                        disabled={queuePending || (!approveForever && !approveUntil)}
                        onClick={() => void submitApprove(item.id)}
                      >
                        Confirm approval
                      </button>
                      <button
                        type="button"
                        className={btnPrimaryOutline}
                        onClick={() => setApprovingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>

      {history.length > 0 ? (
        <DashboardCard title="Recent decisions">
          <ul className="divide-y divide-[var(--border)]/60">
            {history.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {item.requester.displayName} · {item.sectionTitle}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {statusLabel(item.status)}
                    {item.expiresAt ? ` · until ${formatWhen(item.expiresAt)}` : ''}
                    {item.decidedAt ? ` · decided ${formatWhen(item.decidedAt)}` : ''}
                  </p>
                </div>
                {item.status === 'APPROVED' ? (
                  <button
                    type="button"
                    className={btnPrimaryOutline}
                    disabled={queuePending}
                    onClick={() => void revokeGrant(item.id)}
                  >
                    Revoke
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </DashboardCard>
      ) : null}
    </div>
  );
}

function SectionVisibilityRow({
  row,
  onModeChange,
}: {
  row: BiodataSectionVisibilityRowDto;
  onModeChange: (sectionId: string, mode: BiodataSectionVisibilityMode) => void;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{row.title}</p>
        {row.locked ? (
          <p className="text-muted-foreground text-xs">Always public</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            {row.mode === 'DIRECT'
              ? 'Visible to members without asking you'
              : 'Members must request your permission'}
          </p>
        )}
      </div>
      {row.locked ? (
        <span
          className={cn(
            'inline-flex h-9 items-center rounded-full border border-[var(--border)] px-3 text-xs font-medium',
            'text-muted-foreground bg-[var(--muted)]/40',
          )}
        >
          Direct
        </span>
      ) : (
        <SelectWithChevron
          label=""
          value={row.mode}
          onChange={(event) =>
            onModeChange(row.sectionId, event.target.value as BiodataSectionVisibilityMode)
          }
          className="w-full min-w-[11rem] sm:w-auto"
          aria-label={`Visibility for ${row.title}`}
        >
          <option value="DIRECT">Direct</option>
          <option value="REQUEST">Need permission</option>
        </SelectWithChevron>
      )}
    </li>
  );
}
