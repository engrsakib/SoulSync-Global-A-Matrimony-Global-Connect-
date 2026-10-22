'use client';

import * as React from 'react';
import type { BiodataEditorGrantDto } from '@soulsync/shared-types/biodata-editor-grant';
import { toast } from 'sonner';
import {
  decideBiodataEditorGrant,
  fetchEditorGrantsAsOwner,
  requestBiodataEditorAccess,
} from '@/lib/biodata-editor-grant-api';
import { BiodataEditAccessApproveDialog } from '@/components/dashboard/biodata-edit-access-approve-dialog';
import { btnPrimaryMd, btnPrimaryOutlineMd } from '@/lib/ui-classes';
import { UsernameMemberSuggestInput } from '@/components/dashboard/username-member-suggest-input';
import { formatMemberDisplayName } from '@/lib/format-member-display-name';

type BiodataEditAccessPanelProps = {
  onPendingIncomingCountChange?: (count: number) => void;
};

function editorGrantLabel(editor: BiodataEditorGrantDto['editor']): string {
  return (
    formatMemberDisplayName(editor.displayName, editor.username ?? '') ??
    editor.username ??
    'Member'
  );
}

export function BiodataEditAccessPanel({
  onPendingIncomingCountChange,
}: BiodataEditAccessPanelProps) {
  const [pendingIncoming, setPendingIncoming] = React.useState<BiodataEditorGrantDto[]>([]);
  const [history, setHistory] = React.useState<BiodataEditorGrantDto[]>([]);
  const [ownerUsername, setOwnerUsername] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [approveGrant, setApproveGrant] = React.useState<BiodataEditorGrantDto | null>(null);
  const [approvePending, setApprovePending] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const list = await fetchEditorGrantsAsOwner();
      setPendingIncoming(list.pendingIncoming);
      setHistory(list.history);
      onPendingIncomingCountChange?.(list.pendingIncoming.length);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load edit access');
    } finally {
      setLoading(false);
    }
  }, [onPendingIncomingCountChange]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchEditorGrantsAsOwner();
        if (cancelled) {
          return;
        }
        setPendingIncoming(list.pendingIncoming);
        setHistory(list.history);
        onPendingIncomingCountChange?.(list.pendingIncoming.length);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load edit access');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onPendingIncomingCountChange]);

  const decide = async (
    grantId: string,
    decision: 'approve' | 'deny',
    scope?: BiodataEditorGrantDto['scope'],
  ) => {
    try {
      await decideBiodataEditorGrant(grantId, {
        decision,
        ...(decision === 'approve' && scope ? { scope } : {}),
      });
      toast.success(decision === 'approve' ? 'Edit access approved' : 'Request declined');
      setApproveGrant(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const confirmApprove = async (scope: BiodataEditorGrantDto['scope']) => {
    if (!approveGrant) {
      return;
    }
    setApprovePending(true);
    try {
      await decide(approveGrant.id, 'approve', scope);
    } finally {
      setApprovePending(false);
    }
  };

  const requestAccess = async () => {
    const trimmed = ownerUsername.trim();
    if (!trimmed) {
      toast.error('Enter an owner username');
      return;
    }
    try {
      await requestBiodataEditorAccess({
        ownerUsername: trimmed,
        message: message.trim() || undefined,
      });
      setOwnerUsername('');
      setMessage('');
      toast.success('Request sent');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed');
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading edit access…</p>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Request edit access</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Ask another member if you may help manage their biodata.
        </p>
        <div className="mt-4 space-y-3">
          <div className="max-w-md">
            <UsernameMemberSuggestInput
              value={ownerUsername}
              onChange={setOwnerUsername}
              placeholder="Start typing owner username…"
            />
          </div>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Optional message"
            rows={2}
            className="w-full max-w-md rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
          />
          <button type="button" className={btnPrimaryMd} onClick={() => void requestAccess()}>
            Send request
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">
          Pending edit requests
        </h2>
        {pendingIncoming.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No pending edit access requests.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60 rounded-2xl border border-[var(--border)]/80 bg-[var(--background)]">
            {pendingIncoming.map((grant) => (
              <li
                key={grant.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {editorGrantLabel(grant.editor)}
                  </p>
                  {grant.message ? (
                    <p className="text-muted-foreground mt-1 text-xs">{grant.message}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={btnPrimaryOutlineMd}
                    onClick={() => void decide(grant.id, 'deny')}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className={btnPrimaryMd}
                    onClick={() => setApproveGrant(grant)}
                  >
                    Approve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {history.length > 0 ? (
        <section>
          <h2 className="mb-3 text-base font-semibold text-[var(--foreground)]">
            Recent edit access
          </h2>
          <ul className="divide-y divide-[var(--border)]/60 rounded-2xl border border-[var(--border)]/80 bg-[var(--background)]">
            {history.slice(0, 20).map((grant) => (
              <li key={grant.id} className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                {editorGrantLabel(grant.editor)} — {grant.status.toLowerCase()}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <BiodataEditAccessApproveDialog
        open={approveGrant !== null}
        onOpenChange={(open) => {
          if (!open) {
            setApproveGrant(null);
          }
        }}
        editorLabel={approveGrant ? editorGrantLabel(approveGrant.editor) : 'Member'}
        loading={approvePending}
        onConfirm={confirmApprove}
      />
    </div>
  );
}
