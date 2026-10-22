'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import type {
  BiodataEditorGrantDto,
  BiodataEditorScope,
} from '@soulsync/shared-types/biodata-editor-grant';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import {
  decideBiodataEditorGrant,
  fetchEditorGrantsAsOwner,
  inviteBiodataEditor,
  updateBiodataEditorGrantScope,
} from '@/lib/biodata-editor-grant-api';
import { BiodataEditorScopePicker } from '@/components/dashboard/biodata-editor-scope-picker';
import { BiodataEditorScopeBadge } from '@/components/dashboard/biodata-editor-scope-badge';
import { BiodataEditorChangeScopeDialog } from '@/components/dashboard/biodata-editor-change-scope-dialog';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { btnPrimaryMd, btnPrimaryOutlineMd } from '@/lib/ui-classes';
import { UsernameMemberSuggestInput } from '@/components/dashboard/username-member-suggest-input';
import { formatMemberDisplayName } from '@/lib/format-member-display-name';

export function BiodataTrustedEditorsCard() {
  const [username, setUsername] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [activeEditors, setActiveEditors] = React.useState<BiodataEditorGrantDto[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = React.useState<BiodataEditorGrantDto[]>([]);
  const [inviteScope, setInviteScope] = React.useState<BiodataEditorScope>('BOTH');
  const [changeScopeGrant, setChangeScopeGrant] = React.useState<BiodataEditorGrantDto | null>(
    null,
  );
  const [changeScopePending, setChangeScopePending] = React.useState(false);

  const load = React.useCallback(async (options?: { showLoading?: boolean }) => {
    if (options?.showLoading) {
      setLoading(true);
    }
    try {
      const list = await fetchEditorGrantsAsOwner();
      setActiveEditors(list.activeEditors);
      setPendingOutgoing(list.pendingOutgoing);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load editors');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchEditorGrantsAsOwner();
        if (cancelled) {
          return;
        }
        setActiveEditors(list.activeEditors);
        setPendingOutgoing(list.pendingOutgoing);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load editors');
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
  }, []);

  const sendInvite = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      toast.error('Enter a username');
      return;
    }
    setPending(true);
    try {
      await inviteBiodataEditor({
        editorUsername: trimmed,
        message: message.trim() || undefined,
        scope: inviteScope,
      });
      setUsername('');
      setMessage('');
      toast.success('Invite sent');
      await load({ showLoading: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invite failed');
    } finally {
      setPending(false);
    }
  };

  const saveScopeChange = async (scope: BiodataEditorScope) => {
    if (!changeScopeGrant) {
      return;
    }
    setChangeScopePending(true);
    try {
      await updateBiodataEditorGrantScope(changeScopeGrant.id, { scope });
      toast.success('Edit access updated');
      setChangeScopeGrant(null);
      await load({ showLoading: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update access');
    } finally {
      setChangeScopePending(false);
    }
  };

  const revoke = async (grantId: string) => {
    if (!window.confirm('Revoke edit access for this member?')) {
      return;
    }
    try {
      await decideBiodataEditorGrant(grantId, { decision: 'revoke' });
      toast.success('Edit access revoked');
      await load({ showLoading: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not revoke');
    }
  };

  return (
    <DashboardCard title="Trusted biodata editors">
      <p className="text-muted-foreground mb-4 text-sm">
        Invite someone you trust to help complete and manage your biodata. They cannot access your
        login or account email.
      </p>

      <div className="space-y-3 rounded-xl border border-[var(--border)]/60 bg-[var(--muted)]/20 p-4">
        <label className="block text-sm font-medium text-[var(--foreground)]">
          Invite to edit biodata
        </label>
        <UsernameMemberSuggestInput
          value={username}
          onChange={setUsername}
          placeholder="Start typing a username…"
        />
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Optional message"
          rows={2}
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm"
        />
        <div>
          <p className="mb-2 text-xs font-medium text-[var(--foreground)]">What they can edit</p>
          <BiodataEditorScopePicker
            value={inviteScope}
            onChange={setInviteScope}
            name="invite-editor-scope"
          />
        </div>
        <button
          type="button"
          className={btnPrimaryMd}
          disabled={pending}
          onClick={() => void sendInvite()}
        >
          {pending ? 'Sending…' : 'Send invite'}
        </button>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Active editors</h3>
          <Link
            href={`${dashboardRoutes.biodataPermissionRequests}?tab=edit`}
            className="text-xs font-medium text-[var(--color-brand-700)] hover:underline"
          >
            Manage edit requests
          </Link>
        </div>
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
        ) : activeEditors.length === 0 && pendingOutgoing.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No editors yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60 rounded-xl border border-[var(--border)]/60">
            {[...pendingOutgoing, ...activeEditors].map((grant) => {
              const editorLabel =
                formatMemberDisplayName(grant.editor.displayName, grant.editor.username ?? '') ??
                grant.editor.username ??
                'Member';
              return (
                <li
                  key={grant.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{editorLabel}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {grant.status === 'PENDING' ? 'Invite pending' : 'Active editor'}
                      </p>
                      <BiodataEditorScopeBadge scope={grant.scope} />
                    </div>
                  </div>
                  {grant.status === 'APPROVED' ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={btnPrimaryOutlineMd}
                        onClick={() => setChangeScopeGrant(grant)}
                      >
                        Change access
                      </button>
                      <button
                        type="button"
                        className={btnPrimaryOutlineMd}
                        onClick={() => void revoke(grant.id)}
                      >
                        Revoke
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <BiodataEditorChangeScopeDialog
        open={changeScopeGrant !== null}
        onOpenChange={(open) => {
          if (!open) {
            setChangeScopeGrant(null);
          }
        }}
        editorLabel={
          changeScopeGrant
            ? (formatMemberDisplayName(
                changeScopeGrant.editor.displayName,
                changeScopeGrant.editor.username ?? '',
              ) ??
              changeScopeGrant.editor.username ??
              'Member')
            : 'Member'
        }
        initialScope={changeScopeGrant?.scope ?? 'BOTH'}
        formKey={changeScopeGrant?.id}
        loading={changeScopePending}
        onConfirm={saveScopeChange}
      />
    </DashboardCard>
  );
}
