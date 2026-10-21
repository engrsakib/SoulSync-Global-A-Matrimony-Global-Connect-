'use client';

import { useEffect, useState } from 'react';
import type { CommunityJoinRequestDto } from '@soulsync/shared-types/communities';
import { Button } from '@soulsync/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import { decideJoinRequest, fetchJoinRequests } from '@/lib/communities-client';
import { formatCommunityAuthorUsername, formatRelativeTime } from '@/lib/communities-format';
import { toast } from 'sonner';

type CommunityJoinRequestsPanelProps = {
  slug: string;
  onPendingCountChange?: (count: number) => void;
};

export function CommunityJoinRequestsPanel({
  slug,
  onPendingCountChange,
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
              <li key={request.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="font-medium">
                    {formatCommunityAuthorUsername(request.username)}
                  </p>
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
