'use client';

import * as React from 'react';
import Link from 'next/link';
import type {
  BiodataEditorGrantDto,
  BiodataEditorGrantUserDto,
} from '@soulsync/shared-types/biodata-editor-grant';
import { Avatar, AvatarFallback, AvatarImage } from '@soulsync/ui/avatar';
import { toast } from 'sonner';
import {
  decideBiodataEditorGrant,
  fetchEditorGrantsAsOwner,
  requestBiodataEditorAccess,
} from '@/lib/biodata-editor-grant-api';
import { BiodataEditAccessApproveDialog } from '@/components/dashboard/biodata-edit-access-approve-dialog';
import { cn } from '@soulsync/ui/lib/utils';
import { btnPrimaryMd, btnPrimaryOutlineMd, formControlClass } from '@/lib/ui-classes';
import { UsernameMemberSuggestInput } from '@/components/dashboard/username-member-suggest-input';
import { formatMemberDisplayName } from '@/lib/format-member-display-name';
import { memberRoutes } from '@/lib/member-routes';

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

function editorProfileHref(editor: BiodataEditorGrantUserDto): string | null {
  const username = editor.username?.trim();
  if (!username) {
    return null;
  }
  return memberRoutes.memberBiodata(username);
}

function EditorGrantUserIdentity({
  editor,
  message,
}: {
  editor: BiodataEditorGrantUserDto;
  message?: string | null;
}) {
  const label = editorGrantLabel(editor);
  const profileHref = editorProfileHref(editor);
  const username = editor.username?.trim();
  const showUsernameLine = username && !label.startsWith(`@${username}`);
  const initial = (username ?? label).slice(0, 1).toUpperCase();

  const avatar = (
    <Avatar className="h-10 w-10 shrink-0 ring-1 ring-[var(--border)]/60">
      {editor.avatarUrl ? <AvatarImage src={editor.avatarUrl} alt="" /> : null}
      <AvatarFallback className="bg-[var(--muted)] text-xs font-medium">{initial}</AvatarFallback>
    </Avatar>
  );

  return (
    <div className="flex min-w-0 items-center gap-3">
      {profileHref ? (
        <Link href={profileHref} className="shrink-0 rounded-full hover:opacity-90">
          {avatar}
        </Link>
      ) : (
        avatar
      )}
      <div className="min-w-0">
        {profileHref ? (
          <Link
            href={profileHref}
            className="block truncate text-sm font-medium text-[var(--foreground)] hover:underline"
          >
            {label}
          </Link>
        ) : (
          <p className="truncate text-sm font-medium text-[var(--foreground)]">{label}</p>
        )}
        {showUsernameLine ? (
          <p className="text-muted-foreground truncate text-xs">@{username}</p>
        ) : null}
        {message ? <p className="text-muted-foreground mt-1 text-xs">{message}</p> : null}
      </div>
    </div>
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
            className={cn(formControlClass, 'max-w-md')}
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
                <EditorGrantUserIdentity editor={grant.editor} message={grant.message} />
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
              <li
                key={grant.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <EditorGrantUserIdentity editor={grant.editor} />
                <span className="text-sm capitalize text-[var(--muted-foreground)]">
                  {grant.status.toLowerCase()}
                </span>
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
