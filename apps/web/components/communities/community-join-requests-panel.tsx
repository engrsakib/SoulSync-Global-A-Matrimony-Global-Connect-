'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CommunityJoinRequestDto } from '@soulsync/shared-types/communities';
import { Button } from '@soulsync/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import { Avatar, AvatarFallback } from '@soulsync/ui/avatar';
import { decideJoinRequest, fetchJoinRequests } from '@/lib/communities-client';
import { formatCommunityAuthorUsername, formatRelativeTime } from '@/lib/communities-format';
import { memberRoutes } from '@/lib/member-routes';
import { toast } from 'sonner';

type CommunityJoinRequestsPanelProps = {
  slug: string;
  onPendingCountChange?: (count: number) => void;
  /** Match members directory list on the Members page; default is settings card. */
  variant?: 'settings' | 'members';
};

const MEMBER_LIST_CLASS =
  'divide-y divide-[var(--border)]/80 overflow-hidden rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] shadow-sm';

export function CommunityJoinRequestsPanel({
  slug,
  onPendingCountChange,
  variant = 'settings',
}: CommunityJoinRequestsPanelProps) {
  const [requests, setRequests] = useState<CommunityJoinRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchJoinRequests(slug)
      .then((rows) => {
        if (!cancelled) {
          setRequests(rows);
          onPendingCountChange?.(rows.length);
          setLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load join requests');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug, onPendingCountChange]);

  async function handleDecide(id: string, decision: 'approve' | 'deny') {
    setBusyId(id);
    try {
      await decideJoinRequest(slug, id, { decision });
      setRequests((prev) => {
        const next = prev.filter((r) => r.id !== id);
        onPendingCountChange?.(next.length);
        return next;
      });
      toast.success(decision === 'approve' ? 'Member approved' : 'Request denied');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update request');
    } finally {
      setBusyId(null);
    }
  }

  function renderRequestRow(request: CommunityJoinRequestDto) {
    const initials = (request.username ?? '??').slice(0, 2).toUpperCase();

    return (
      <li
        key={request.id}
        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {request.username ? (
              <Link
                href={memberRoutes.communityMember(slug, request.username)}
                className="font-medium hover:underline"
              >
                {formatCommunityAuthorUsername(request.username)}
              </Link>
            ) : (
              <span className="font-medium">Member</span>
            )}
            {request.message ? (
              <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                {request.message}
              </p>
            ) : null}
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Requested {formatRelativeTime(request.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <Button
            type="button"
            size="sm"
            disabled={busyId === request.id}
            onClick={() => void handleDecide(request.id, 'approve')}
          >
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busyId === request.id}
            onClick={() => void handleDecide(request.id, 'deny')}
          >
            Deny
          </Button>
        </div>
      </li>
    );
  }

  if (variant === 'members') {
    if (loading) {
      return (
        <p className="text-center text-sm text-[var(--muted-foreground)]">Loading requests…</p>
      );
    }
    if (requests.length === 0) {
      return (
        <p className="text-center text-sm text-[var(--muted-foreground)]">No pending requests.</p>
      );
    }
    return <ul className={MEMBER_LIST_CLASS}>{requests.map(renderRequestRow)}</ul>;
  }

  return (
    <Card className="border-[var(--border)]/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Pending join requests</CardTitle>
        <p className="text-sm text-[var(--muted-foreground)]">
          Review members who asked to join this private community.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading requests…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/80">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">{formatCommunityAuthorUsername(request.username)}</p>
                  {request.message ? (
                    <p className="text-sm text-[var(--muted-foreground)]">{request.message}</p>
                  ) : null}
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Requested {formatRelativeTime(request.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busyId === request.id}
                    onClick={() => void handleDecide(request.id, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyId === request.id}
                    onClick={() => void handleDecide(request.id, 'deny')}
                  >
                    Deny
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
