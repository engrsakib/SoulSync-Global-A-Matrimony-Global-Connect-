'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import type { MarriageConfirmationDto } from '@soulsync/shared-types/marriage-confirmation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@soulsync/ui/avatar';
import { Label } from '@soulsync/ui/label';
import { dateToIso, IsoDatePicker } from '@soulsync/ui/iso-date-picker';
import {
  acceptMarriageConfirmation,
  cancelMarriageConfirmation,
  createMarriageConfirmation,
  declineMarriageConfirmation,
  fetchMarriageConfirmations,
  searchMarriagePartnerUsernames,
} from '@/lib/marriage-confirmation-api';
import { UsernameMemberSuggestInput } from '@/components/dashboard/username-member-suggest-input';
import { btnPrimaryMd, btnPrimaryOutlineMd } from '@/lib/ui-classes';
import { formatMemberDisplayName } from '@/lib/format-member-display-name';
import { memberRoutes } from '@/lib/member-routes';

type ConfirmMarriageSectionProps = {
  disabled?: boolean;
};

function partnerLabel(row: MarriageConfirmationDto, asUserId: string): string {
  const partner = row.initiatorUserId === asUserId ? row.partner : row.initiator;
  return (
    formatMemberDisplayName(partner.displayName, partner.username ?? '') ??
    partner.username ??
    'Member'
  );
}

function MarriageRowCard({
  row,
  viewerUserId,
  onUpdated,
}: {
  row: MarriageConfirmationDto;
  viewerUserId: string;
  onUpdated: () => Promise<void>;
}) {
  const partner = row.initiatorUserId === viewerUserId ? row.partner : row.initiator;
  const label = partnerLabel(row, viewerUserId);
  const username = partner.username?.trim();
  const href = username ? memberRoutes.memberBiodata(username) : null;
  const initial = (username ?? label).slice(0, 1).toUpperCase();

  const act = async (action: 'accept' | 'decline' | 'cancel') => {
    try {
      if (action === 'accept') {
        await acceptMarriageConfirmation(row.id);
        toast.success('Marriage confirmed');
      } else if (action === 'decline') {
        await declineMarriageConfirmation(row.id);
        toast.success('Request declined');
      } else {
        await cancelMarriageConfirmation(row.id);
        toast.success('Request cancelled');
      }
      await onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-[var(--border)]/80 bg-[var(--background)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0 ring-1 ring-[var(--border)]/60">
          {partner.avatarUrl ? <AvatarImage src={partner.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-[var(--muted)] text-xs font-medium">
            {initial}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          {href ? (
            <Link href={href} className="block truncate text-sm font-medium hover:underline">
              {label}
            </Link>
          ) : (
            <p className="truncate text-sm font-medium">{label}</p>
          )}
          <p className="text-muted-foreground text-xs">
            Marriage date: {row.marriageDate}
            {row.status === 'PENDING' ? ' · Pending' : null}
            {row.status === 'CONFIRMED' ? ' · Confirmed' : null}
            {row.status === 'DECLINED' ? ' · Declined' : null}
            {row.status === 'CANCELLED' ? ' · Cancelled' : null}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {row.status === 'PENDING' && row.partnerUserId === viewerUserId ? (
          <>
            <button type="button" className={btnPrimaryMd} onClick={() => void act('accept')}>
              Accept
            </button>
            <button
              type="button"
              className={btnPrimaryOutlineMd}
              onClick={() => void act('decline')}
            >
              Decline
            </button>
          </>
        ) : null}
        {row.status === 'PENDING' && row.initiatorUserId === viewerUserId ? (
          <button type="button" className={btnPrimaryOutlineMd} onClick={() => void act('cancel')}>
            Cancel request
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function ConfirmMarriageSection({ disabled }: ConfirmMarriageSectionProps) {
  const [loading, setLoading] = React.useState(true);
  const [partnerUsername, setPartnerUsername] = React.useState('');
  const [marriageDate, setMarriageDate] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [list, setList] = React.useState<Awaited<
    ReturnType<typeof fetchMarriageConfirmations>
  > | null>(null);

  const load = React.useCallback(async () => {
    const data = await fetchMarriageConfirmations();
    setList(data);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchMarriageConfirmations();
        if (cancelled) {
          return;
        }
        setList(data);
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : 'Could not load marriage confirmations',
          );
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

  const marriageDateMaxIso = React.useMemo(() => dateToIso(new Date()), []);
  const marriageDateMinIso = React.useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    return dateToIso(d);
  }, []);

  const submit = async () => {
    const trimmed = partnerUsername.trim();
    if (!trimmed) {
      toast.error('Enter your partner’s username');
      return;
    }
    if (!marriageDate) {
      toast.error('Choose your marriage date');
      return;
    }
    setSubmitting(true);
    try {
      await createMarriageConfirmation({ partnerUsername: trimmed, marriageDate });
      setPartnerUsername('');
      setMarriageDate('');
      toast.success('Confirmation request sent');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--background)] p-6 shadow-sm">
        <p className="text-sm text-[var(--muted-foreground)]">Loading confirm marriage…</p>
      </section>
    );
  }

  const viewerUserId = list?.viewerUserId ?? '';
  const pendingIncoming = list?.pendingIncoming ?? [];
  const pendingOutgoing = list?.pendingOutgoing ?? [];
  const confirmed = list?.confirmed ?? [];
  const history = list?.history ?? [];

  const sendRequestForm = !disabled ? (
    <div className="mt-8 grid gap-4 border-t border-[var(--border)]/60 pt-8 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <div>
        <Label htmlFor="marriage-partner" className="text-xs text-[var(--muted-foreground)]">
          Partner username
        </Label>
        <div className="mt-1">
          <UsernameMemberSuggestInput
            id="marriage-partner"
            value={partnerUsername}
            onChange={setPartnerUsername}
            placeholder="Opposite-gender member"
            searchMembers={searchMarriagePartnerUsernames}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="marriage-date" className="text-xs text-[var(--muted-foreground)]">
          Marriage date
        </Label>
        <div className="mt-1 min-w-[10rem]">
          <IsoDatePicker
            id="marriage-date"
            value={marriageDate}
            onChange={setMarriageDate}
            minIso={marriageDateMinIso}
            maxIso={marriageDateMaxIso}
            placeholder="Select marriage date"
          />
        </div>
      </div>
      <button
        type="button"
        className={btnPrimaryMd}
        disabled={submitting}
        onClick={() => void submit()}
      >
        {submitting ? 'Sending…' : 'Send request'}
      </button>
    </div>
  ) : null;

  return (
    <section className="rounded-2xl border border-[var(--color-brand-700)]/25 bg-[var(--background)] p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)]/10 text-[var(--color-brand-700)]">
          <Heart className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Confirm marriage</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Record a mutual marriage with another member. When they accept, both names and the
            marriage date appear on your public biodata.
          </p>
        </div>
      </div>

      {pendingIncoming.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold">Requests for you</h3>
          <ul className="mt-3 space-y-3">
            {pendingIncoming.map((row) => (
              <MarriageRowCard
                key={row.id}
                row={row}
                viewerUserId={row.partnerUserId}
                onUpdated={load}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {pendingOutgoing.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold">Awaiting partner</h3>
          <ul className="mt-3 space-y-3">
            {pendingOutgoing.map((row) => (
              <MarriageRowCard
                key={row.id}
                row={row}
                viewerUserId={row.initiatorUserId}
                onUpdated={load}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {confirmed.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold">Confirmed</h3>
          <ul className="mt-3 space-y-3">
            {confirmed.map((row) => (
              <MarriageRowCard
                key={row.id}
                row={row}
                viewerUserId={viewerUserId}
                onUpdated={load}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)]">History</h3>
          <ul className="mt-3 space-y-3">
            {history.map((row) => (
              <MarriageRowCard
                key={row.id}
                row={row}
                viewerUserId={viewerUserId}
                onUpdated={load}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {sendRequestForm}
    </section>
  );
}
