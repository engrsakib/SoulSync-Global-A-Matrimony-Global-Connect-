'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {
  BiodataEditorGrantDto,
  BiodataManagedProfileSummaryDto,
} from '@soulsync/shared-types/biodata-editor-grant';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { toast } from 'sonner';
import {
  decideBiodataEditorGrant,
  fetchEditorGrantsAsEditor,
} from '@/lib/biodata-editor-grant-api';
import { BiodataEditorScopeBadge } from '@/components/dashboard/biodata-editor-scope-badge';
import { dashboardRoutes } from '@/lib/dashboard-routes';
import { btnPrimaryMd, btnPrimaryOutlineMd, dashboardPageTitle } from '@/lib/ui-classes';

export function BiodataManagedHub() {
  const [profiles, setProfiles] = React.useState<BiodataManagedProfileSummaryDto[]>([]);
  const [pendingInvites, setPendingInvites] = React.useState<BiodataEditorGrantDto[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const list = await fetchEditorGrantsAsEditor();
      setProfiles(list.activeManaged);
      setPendingInvites(list.pendingInvites);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load profiles');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const list = await fetchEditorGrantsAsEditor();
        if (cancelled) {
          return;
        }
        setProfiles(list.activeManaged);
        setPendingInvites(list.pendingInvites);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load profiles');
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

  const decideInvite = async (grantId: string, decision: 'approve' | 'deny') => {
    try {
      await decideBiodataEditorGrant(grantId, { decision });
      toast.success(decision === 'approve' ? 'You can now edit their biodata' : 'Invite declined');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={dashboardPageTitle}>Biodata I manage</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          Profiles you can edit on behalf of other members. Open a profile to update biodata,
          gallery, and visibility settings.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      ) : (
        <>
          {pendingInvites.length > 0 ? (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                Edit invites for you
              </h2>
              <ul className="mt-3 space-y-3">
                {pendingInvites.map((grant) => (
                  <li
                    key={grant.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)]/60 bg-[var(--background)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {grant.owner.displayName ?? grant.owner.username ?? 'Member'}
                      </p>
                      <div className="mt-1">
                        <BiodataEditorScopeBadge scope={grant.scope} />
                      </div>
                      {grant.message ? (
                        <p className="text-muted-foreground mt-1 text-xs">{grant.message}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={btnPrimaryOutlineMd}
                        onClick={() => void decideInvite(grant.id, 'deny')}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className={btnPrimaryMd}
                        onClick={() => void decideInvite(grant.id, 'approve')}
                      >
                        Accept
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {profiles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-10 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">No managed biodata yet</p>
              <p className="text-muted-foreground mt-2 text-sm">
                When someone invites you—or approves your edit request—their profile will appear
                here.
              </p>
              <Link
                href={`${dashboardRoutes.biodataPermissionRequests}?tab=edit`}
                className="mt-4 inline-block text-sm font-medium text-[var(--color-brand-700)] hover:underline"
              >
                Request edit access
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => {
                const label = profile.displayName ?? profile.username ?? 'Member';
                const href = profile.username
                  ? dashboardRoutes.biodataManagedUser(profile.username)
                  : dashboardRoutes.biodataManaged;
                return (
                  <article
                    key={profile.grantId}
                    className="flex flex-col rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-14 w-14">
                        {profile.avatarUrl ? (
                          <Image
                            src={profile.avatarUrl}
                            alt=""
                            width={56}
                            height={56}
                            className="object-cover"
                          />
                        ) : (
                          <AvatarFallback>{label.slice(0, 2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[var(--foreground)]">
                          {label}
                        </p>
                        {profile.username ? (
                          <p className="text-muted-foreground truncate text-sm">
                            @{profile.username}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <BiodataEditorScopeBadge scope={profile.scope} />
                    </div>
                    <p className="text-muted-foreground mt-3 text-sm">
                      Completeness:{' '}
                      <span className="font-semibold text-[var(--color-brand-700)]">
                        {profile.completenessPercent}%
                      </span>
                    </p>
                    {profile.username ? (
                      <Link
                        href={href}
                        className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-brand-700)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)]"
                      >
                        Open overview
                      </Link>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
