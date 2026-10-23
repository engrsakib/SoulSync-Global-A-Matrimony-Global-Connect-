'use client';

import * as React from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import type { Gender } from '@soulsync/shared-types/partner-preference';
import type {
  MarriageConfirmationDto,
  MarriageConfirmationListDto,
} from '@soulsync/shared-types/marriage-confirmation';
import { maxMarriageSlotsForGender } from '@soulsync/shared-types/marriage-record';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@soulsync/ui/avatar';
import { Label } from '@soulsync/ui/label';
import { dateToIso, IsoDatePicker } from '@soulsync/ui/iso-date-picker';
import {
  acceptMarriageConfirmation,
  acceptMarriageDivorce,
  cancelMarriageConfirmation,
  cancelMarriageDivorceRequest,
  createMarriageConfirmation,
  declineMarriageConfirmation,
  declineMarriageDivorceRequest,
  fetchMarriageConfirmations,
  markMarriageConfirmationDeceased,
  requestMarriageDivorce,
  searchMarriagePartnerUsernames,
} from '@/lib/marriage-confirmation-api';
import { UsernameMemberSuggestInput } from '@/components/dashboard/username-member-suggest-input';
import { btnPrimaryMd, btnPrimaryOutlineMd } from '@/lib/ui-classes';
import { formatMemberDisplayName } from '@/lib/format-member-display-name';
import { memberRoutes } from '@/lib/member-routes';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { MarriageRegistrySection } from '@/components/dashboard/marriage-registry-section';
import type { MarriageRecordListDto } from '@soulsync/shared-types/marriage-record';
import { fetchMarriageRecords, updateMarriageRecordPublicPartner } from '@/lib/marriage-record-api';

type ConfirmMarriageSectionProps = {
  disabled?: boolean;
  gender: Gender | null;
  profileCountry: string | null;
};

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{value || '—'}</p>
    </div>
  );
}

function isMarriageSectionStarted(
  registry: MarriageRecordListDto | null,
  list: MarriageConfirmationListDto | null,
): boolean {
  const records = registry?.records ?? [];
  if (
    records.some(
      (record) =>
        record.status !== 'DRAFT' ||
        Boolean(record.spouseName?.trim() || record.marriageDate?.trim()),
    )
  ) {
    return true;
  }
  if (!list) {
    return false;
  }
  return (
    list.pendingIncoming.length > 0 ||
    list.pendingOutgoing.length > 0 ||
    list.confirmed.length > 0 ||
    list.history.length > 0
  );
}

function partnerLabel(row: MarriageConfirmationDto, asUserId: string): string {
  if (!row.partnerUserId) {
    return 'No partner linked';
  }
  const partner = row.initiatorUserId === asUserId ? row.partner : row.initiator;
  if (!partner) {
    return 'Member';
  }
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const linkedPartner = row.partnerUserId
    ? row.initiatorUserId === viewerUserId
      ? row.partner
      : row.initiator
    : null;
  const label = partnerLabel(row, viewerUserId);
  const username = linkedPartner?.username?.trim();
  const href = username ? memberRoutes.memberBiodata(username) : null;
  const initial = (username ?? label).slice(0, 1).toUpperCase();
  const canUseMutualActions =
    row.status === 'CONFIRMED' && row.partnerUserId != null && viewerUserId.length > 0;
  const divorcePending = canUseMutualActions && row.divorceRequestedByUserId != null;
  const divorceRequestedByMe = divorcePending && row.divorceRequestedByUserId === viewerUserId;
  const divorceRequestedBySpouse = divorcePending && !divorceRequestedByMe;

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      toast.success(success);
      setMenuOpen(false);
      await onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

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
      <div className="relative flex min-w-0 flex-1 items-center gap-3 pr-8">
        <Avatar className="h-10 w-10 shrink-0 ring-1 ring-[var(--border)]/60">
          {linkedPartner?.avatarUrl ? <AvatarImage src={linkedPartner.avatarUrl} alt="" /> : null}
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
            {row.status === 'CONFIRMED' && !divorcePending ? ' · Confirmed' : null}
            {row.status === 'CONFIRMED' && divorcePending ? ' · Divorce pending' : null}
            {row.status === 'DECLINED' ? ' · Declined' : null}
            {row.status === 'CANCELLED' ? ' · Cancelled' : null}
            {row.status === 'DIVORCED' ? ' · Divorced' : null}
            {row.status === 'DECEASED' ? ' · Deceased' : null}
          </p>
        </div>
        {canUseMutualActions && !divorcePending ? (
          <>
            <button
              type="button"
              aria-label="Marriage actions"
              className="absolute top-0 right-0 rounded-md p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div className="absolute top-8 right-0 z-10 min-w-[11rem] rounded-md border border-[var(--border)] bg-[var(--background)] py-1 shadow-md">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                  onClick={() =>
                    void run(() => requestMarriageDivorce(row.id), 'Divorce request sent to spouse')
                  }
                >
                  Request divorce
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                  onClick={() =>
                    void run(() => markMarriageConfirmationDeceased(row.id), 'Marked as deceased')
                  }
                >
                  Mark deceased
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {row.status === 'PENDING' &&
        row.partnerUserId != null &&
        row.partnerUserId === viewerUserId ? (
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
        {divorceRequestedByMe ? (
          <button
            type="button"
            className={btnPrimaryOutlineMd}
            onClick={() =>
              void run(() => cancelMarriageDivorceRequest(row.id), 'Divorce request cancelled')
            }
          >
            Cancel divorce request
          </button>
        ) : null}
        {divorceRequestedBySpouse ? (
          <>
            <button
              type="button"
              className={btnPrimaryMd}
              onClick={() => void run(() => acceptMarriageDivorce(row.id), 'Divorce confirmed')}
            >
              Confirm divorce
            </button>
            <button
              type="button"
              className={btnPrimaryOutlineMd}
              onClick={() =>
                void run(() => declineMarriageDivorceRequest(row.id), 'Divorce request declined')
              }
            >
              Decline divorce
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}

export function ConfirmMarriageSection({
  disabled,
  gender,
  profileCountry,
}: ConfirmMarriageSectionProps) {
  const [loading, setLoading] = React.useState(true);
  const [partnerUsername, setPartnerUsername] = React.useState('');
  const [marriageDate, setMarriageDate] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [privacySaving, setPrivacySaving] = React.useState(false);
  const [hidePartnerOnPublic, setHidePartnerOnPublic] = React.useState(true);
  const [list, setList] = React.useState<MarriageConfirmationListDto | null>(null);
  const [registryData, setRegistryData] = React.useState<MarriageRecordListDto | null>(null);
  const [activeMarriageCount, setActiveMarriageCount] = React.useState(0);
  const [editing, setEditing] = React.useState(false);

  const load = React.useCallback(async () => {
    const [data, registry] = await Promise.all([
      fetchMarriageConfirmations(),
      fetchMarriageRecords().catch(() => null),
    ]);
    setList(data);
    setRegistryData(registry);
    if (registry) {
      setHidePartnerOnPublic(registry.showMarriagePartnerOnPublicBiodata !== true);
      const linkedConfirmationIds = new Set(
        registry.records
          .map((record) => record.marriageConfirmationId)
          .filter((id): id is string => id != null),
      );
      const registryActive = registry.records.filter(
        (record) => record.status === 'CONFIRMED',
      ).length;
      const standaloneMutual = data.confirmed.filter(
        (row) => !linkedConfirmationIds.has(row.id),
      ).length;
      setActiveMarriageCount(registryActive + standaloneMutual);
    } else {
      setActiveMarriageCount(data.confirmed.length);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
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
  }, [load]);

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

  const cardBody = loading ? (
    <p className="text-sm text-[var(--muted-foreground)]">Loading confirm marriage…</p>
  ) : null;

  const viewerUserId = list?.viewerUserId ?? '';
  const pendingIncoming = list?.pendingIncoming ?? [];
  const pendingOutgoing = list?.pendingOutgoing ?? [];
  const confirmed = list?.confirmed ?? [];
  const history = list?.history ?? [];
  const maxMarriages = maxMarriageSlotsForGender(gender);
  const atMarriageCap = activeMarriageCount >= maxMarriages && maxMarriages > 0;

  const togglePublicPartnerPrivacy = async (hideNames: boolean) => {
    setPrivacySaving(true);
    try {
      const next = await updateMarriageRecordPublicPartner(!hideNames);
      setHidePartnerOnPublic(next.showMarriagePartnerOnPublicBiodata !== true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save privacy setting');
    } finally {
      setPrivacySaving(false);
    }
  };

  const sendRequestForm =
    !disabled && !atMarriageCap && maxMarriages > 0 ? (
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
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

  const started = !loading && isMarriageSectionStarted(registryData, list);
  const registryRecords = registryData?.records ?? [];
  const linkedConfirmationIds = new Set(
    registryRecords
      .map((record) => record.marriageConfirmationId)
      .filter((id): id is string => id != null),
  );
  const registryConfirmationDates = new Set(
    registryRecords
      .map((record) => record.marriageDate?.trim())
      .filter((date): date is string => Boolean(date)),
  );
  const confirmedSoulSyncOnly = confirmed.filter((row) => {
    if (linkedConfirmationIds.has(row.id)) {
      return false;
    }
    if (!row.partnerUserId && registryConfirmationDates.has(row.marriageDate)) {
      return false;
    }
    return true;
  });

  const readView =
    !loading && !editing ? (
      started ? (
        <div className="space-y-6">
          <p className="text-muted-foreground text-xs">
            Marriage history is private and encrypted. Marriage dates may appear on your public
            biodata; partner names only if you allow it below.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <SummaryField
              label="Partner names on public biodata"
              value={hidePartnerOnPublic ? 'Hidden' : 'Shown'}
            />
            {registryRecords.some((record) => record.status === 'DRAFT') ? (
              <SummaryField label="Registry draft" value="In progress — click Edit to continue" />
            ) : null}
          </div>
          <MarriageRegistrySection
            gender={gender}
            profileCountry={profileCountry}
            disabled={disabled}
            sectionEditing={false}
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">Not started — click Edit to add.</p>
      )
    ) : null;

  const pendingBlock =
    !loading && editing ? (
      <>
        {pendingIncoming.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold">SoulSync requests for you</h3>
            <ul className="mt-3 space-y-3">
              {pendingIncoming.map((row) => (
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
        {pendingOutgoing.length > 0 ? (
          <div className={pendingIncoming.length > 0 ? 'mt-8' : ''}>
            <h3 className="text-sm font-semibold">SoulSync requests awaiting partner</h3>
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
      </>
    ) : null;

  const editView =
    !loading && editing ? (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">
          {gender === 'FEMALE'
            ? 'Only one active husband at a time. After you confirm, the record is locked until you mark divorced or deceased; then use Add new husband in the registry. Past marriages stay on your profile.'
            : 'Up to four wives. Use the checkboxes under Additional wives to add a second, third, or fourth marriage. After you confirm a record it is locked; you can only mark it divorced or deceased later.'}
        </p>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={hidePartnerOnPublic}
            disabled={privacySaving || disabled}
            onChange={(e) => void togglePublicPartnerPrivacy(e.target.checked)}
          />
          <span>Do not show partner names on my public biodata (marriage dates still visible)</span>
        </label>
        {pendingBlock}
        <MarriageRegistrySection
          key="registry-edit"
          gender={gender}
          profileCountry={profileCountry}
          disabled={disabled}
          sectionEditing
        />
      </div>
    ) : null;

  const actionLists = !loading ? (
    <>
      {!editing && pendingIncoming.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold">SoulSync requests for you</h3>
          <ul className="mt-3 space-y-3">
            {pendingIncoming.map((row) => (
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

      {!editing && pendingOutgoing.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-sm font-semibold">SoulSync requests awaiting partner</h3>
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

      {confirmedSoulSyncOnly.length > 0 ? (
        <div className={editing ? 'mt-8' : 'mt-6'}>
          <h3 className="text-sm font-semibold">Mutual SoulSync confirmations</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Shown when a spouse is on SoulSync and not already listed in your marriage registry
            above.
          </p>
          <ul className="mt-3 space-y-3">
            {confirmedSoulSyncOnly.map((row) => (
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

      {editing && atMarriageCap && maxMarriages > 0 ? (
        <p className="text-muted-foreground mt-8 text-sm">
          You have reached the maximum number of active marriages for your profile. Mark a marriage
          divorced or deceased before adding another, or respond to pending requests only.
        </p>
      ) : null}

      {editing && sendRequestForm ? (
        <div className="mt-8 border-t border-[var(--border)]/60 pt-6">
          <h3 className="text-sm font-semibold">Optional: link a SoulSync member</h3>
          <p className="text-muted-foreground mt-1 text-xs">
            Send a mutual confirmation request when your spouse is on SoulSync. You can also enter
            their username in the registry form when confirming.
          </p>
          {sendRequestForm}
        </div>
      ) : null}
    </>
  ) : null;

  return (
    <DashboardCard title="Confirm marriage">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          disabled={disabled || loading}
          className={cn(
            'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold',
            editing
              ? 'border border-[var(--border)] text-[var(--foreground)]'
              : 'bg-[var(--color-brand-700)] text-white hover:bg-[var(--color-brand-800)]',
          )}
          onClick={() => setEditing((current) => !current)}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>
      {cardBody}
      {readView}
      {editView}
      {actionLists}
    </DashboardCard>
  );
}
