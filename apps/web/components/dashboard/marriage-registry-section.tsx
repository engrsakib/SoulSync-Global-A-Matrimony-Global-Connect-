'use client';

import * as React from 'react';
import type { Gender } from '@soulsync/shared-types/partner-preference';
import type {
  MarriageRecordArchiveDto,
  MarriageRecordChildDto,
  MarriageRecordDto,
} from '@soulsync/shared-types/marriage-record';
import { isMarriageRecordSlotOccupiedForProgression } from '@soulsync/shared-types/marriage-record';
import { isCountryCode, type CountryCode } from '@soulsync/shared-types/phone';
import { cn } from '@soulsync/ui/lib/utils';
import { Label } from '@soulsync/ui/label';
import { dateToIso, IsoDatePicker } from '@soulsync/ui/iso-date-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@soulsync/ui/alert-dialog';
import { FaTelegram, FaWhatsapp } from 'react-icons/fa';
import { toast } from 'sonner';
import { MarriageEndActionsMenu } from '@/components/dashboard/marriage-end-actions-menu';
import {
  beginMarriageRemarriage,
  confirmMarriageRecordSlot,
  fetchMarriageRecords,
  updateMarriageRecordStatus,
  upsertMarriageRecordDraft,
} from '@/lib/marriage-record-api';
import { InternationalPhoneField } from '@/components/dashboard/international-phone-field';
import { MessagingUsernameField } from '@/components/dashboard/messaging-username-field';
import { UsernameMemberSuggestInput } from '@/components/dashboard/username-member-suggest-input';
import { searchMarriagePartnerUsernames } from '@/lib/marriage-confirmation-api';
import { fetchCountries } from '@/lib/geo/client';
import { btnPrimaryMd, btnPrimaryOutlineMd } from '@/lib/ui-classes';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const ORDINALS = ['first', 'second', 'third', 'fourth'] as const;

export function marriageRegistrySlotTitle(gender: Gender | null, slotIndex: number): string {
  const role = gender === 'FEMALE' ? 'husband' : 'wife';
  if (gender === 'FEMALE') {
    return 'Confirm marriage (husband)';
  }
  const ord = ORDINALS[slotIndex - 1] ?? `${slotIndex}`;
  return `Confirm ${ord} marriage (${role})`;
}

function wantNextMarriageLabel(slotIndex: number): string {
  const ord = ORDINALS[slotIndex - 1] ?? `${slotIndex}`;
  return `I have a ${ord} wife`;
}

type WifeOption = { slotIndex: number; label: string };

function buildWifeOptions(
  gender: Gender | null,
  records: MarriageRecordDto[],
  drafts: Record<number, DraftState>,
  maxSlots: number,
): WifeOption[] {
  if (gender !== 'MALE') {
    return [];
  }
  const options: WifeOption[] = [];
  for (let slot = 1; slot <= maxSlots; slot += 1) {
    const record = records.find((r) => r.slotIndex === slot);
    const draft = drafts[slot];
    const name = (draft?.spouseName.trim() || record?.spouseName?.trim()) ?? '';
    if (!name) {
      continue;
    }
    const ord = ORDINALS[slot - 1] ?? `${slot}`;
    options.push({ slotIndex: slot, label: `${ord} wife — ${name}` });
  }
  return options;
}

type DraftState = {
  spouseName: string;
  marriageDate: string;
  spousePhone: string;
  spouseTelegram: string;
  spouseWhatsApp: string;
  partnerUsername: string;
  children: MarriageRecordChildDto[];
};

function emptyDraft(): DraftState {
  return {
    spouseName: '',
    marriageDate: '',
    spousePhone: '',
    spouseTelegram: '',
    spouseWhatsApp: '',
    partnerUsername: '',
    children: [],
  };
}

function draftFromRecord(record: MarriageRecordDto | undefined): DraftState {
  if (!record) {
    return emptyDraft();
  }
  return {
    spouseName: record.spouseName ?? '',
    marriageDate: record.marriageDate ?? '',
    spousePhone: record.spousePhone ?? '',
    spouseTelegram: record.spouseTelegram ? `@${record.spouseTelegram.replace(/^@/, '')}` : '',
    spouseWhatsApp: record.spouseWhatsApp ? `@${record.spouseWhatsApp.replace(/^@/, '')}` : '',
    partnerUsername: record.partnerUsername ?? '',
    children: record.children ?? [],
  };
}

function ArchivedRecordView({
  record,
  gender,
}: {
  record: MarriageRecordArchiveDto;
  gender: Gender | null;
}) {
  const role = gender === 'FEMALE' ? 'Husband' : 'Wife';
  return (
    <div className="rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/15 p-4">
      <p className="text-sm font-semibold text-[var(--muted-foreground)]">
        Past marriage · {record.endedStatus.toLowerCase()}
      </p>
      <p className="text-muted-foreground mt-1 text-xs">
        {role}: {record.spouseName ?? '—'} · Date: {record.marriageDate ?? '—'}
      </p>
      {record.children.length > 0 ? (
        <ul className="mt-2 space-y-1 text-xs text-[var(--foreground)]">
          {record.children.map((child, index) => (
            <li key={`${child.name}-${index}`}>
              Child: {child.name} ({child.gender}) · DOB {child.dateOfBirth}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function LockedRecordView({
  record,
  gender,
  onStatus,
  wifeNameBySlot,
}: {
  record: MarriageRecordDto;
  gender: Gender | null;
  onStatus: (status: 'DIVORCED' | 'DECEASED') => Promise<void>;
  wifeNameBySlot?: Map<number, string>;
}) {
  const role = gender === 'FEMALE' ? 'Husband' : 'Wife';
  return (
    <div className="rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/20 p-4 shadow-sm">
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {marriageRegistrySlotTitle(gender, record.slotIndex)} · {record.status.toLowerCase()}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {role}: {record.spouseName ?? '—'} · Date: {record.marriageDate ?? '—'}
          </p>
          {record.children.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-[var(--foreground)]">
              {record.children.map((child, index) => {
                const motherSlot = child.motherSlotIndex ?? record.slotIndex;
                const motherName =
                  wifeNameBySlot?.get(motherSlot) ??
                  (motherSlot === record.slotIndex ? record.spouseName : null);
                return (
                  <li key={`${child.name}-${index}`}>
                    Child: {child.name} ({child.gender}) · DOB {child.dateOfBirth}
                    {wifeNameBySlot && wifeNameBySlot.size > 1 && motherName
                      ? ` · Mother: ${motherName}`
                      : ''}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
        {record.status === 'CONFIRMED' ? (
          <MarriageEndActionsMenu
            onMarkDivorced={() => void onStatus('DIVORCED')}
            onMarkDeceased={() => void onStatus('DECEASED')}
          />
        ) : null}
      </div>
    </div>
  );
}

function SlotDraftSummary({
  slotIndex,
  gender,
  draft,
  record,
  onEdit,
  disabled,
}: {
  slotIndex: number;
  gender: Gender | null;
  draft: DraftState;
  record: MarriageRecordDto | undefined;
  onEdit: () => void;
  disabled?: boolean;
}) {
  const role = gender === 'FEMALE' ? 'Husband' : 'Wife';
  const hasDraft =
    record?.status === 'DRAFT' ||
    Boolean(draft.spouseName.trim() || draft.marriageDate.trim() || draft.spousePhone.trim());
  const summary = hasDraft
    ? `${draft.spouseName.trim() || 'Draft in progress'}${draft.marriageDate ? ` · ${draft.marriageDate}` : ''}`
    : 'Not started — click Edit to add.';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)]/80 bg-[var(--background)] p-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{marriageRegistrySlotTitle(gender, slotIndex)}</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {role}: {summary}
        </p>
      </div>
      <button type="button" className={btnPrimaryOutlineMd} disabled={disabled} onClick={onEdit}>
        Edit
      </button>
    </div>
  );
}

function SlotDraftForm({
  slotIndex,
  gender,
  draft,
  setDraft,
  defaultPhoneCountry,
  disabled,
  onSaveDraft,
  onOpenConfirm,
  onCancelEdit,
  saving,
  wifeOptions,
}: {
  slotIndex: number;
  gender: Gender | null;
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  defaultPhoneCountry: CountryCode;
  disabled?: boolean;
  onSaveDraft: () => Promise<void>;
  onOpenConfirm: () => void;
  onCancelEdit: () => void;
  saving: boolean;
  wifeOptions: WifeOption[];
}) {
  const roleLabel = gender === 'FEMALE' ? 'Husband' : 'Wife';
  const showMotherSelect = wifeOptions.length > 1;

  const updateChild = (index: number, patch: Partial<MarriageRecordChildDto>) => {
    setDraft((current) => ({
      ...current,
      children: current.children.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-brand-700)]/25 p-4">
      <h3 className="text-sm font-semibold">{marriageRegistrySlotTitle(gender, slotIndex)}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`spouse-name-${slotIndex}`}>{roleLabel} name</Label>
          <input
            id={`spouse-name-${slotIndex}`}
            className={cn(inputClass, 'mt-1.5')}
            value={draft.spouseName}
            disabled={disabled}
            onChange={(e) => setDraft((d) => ({ ...d, spouseName: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor={`marriage-date-${slotIndex}`}>Marriage date</Label>
          <div className="mt-1.5">
            <IsoDatePicker
              id={`marriage-date-${slotIndex}`}
              value={draft.marriageDate}
              onChange={(v) => setDraft((d) => ({ ...d, marriageDate: v }))}
              maxIso={dateToIso(new Date())}
              placeholder="Select date"
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <InternationalPhoneField
            id={`spouse-phone-${slotIndex}`}
            label={`${roleLabel} mobile`}
            valueE164={draft.spousePhone}
            defaultCountry={defaultPhoneCountry}
            onChange={(v) => setDraft((d) => ({ ...d, spousePhone: v }))}
          />
        </div>
        <MessagingUsernameField
          id={`spouse-telegram-${slotIndex}`}
          label={`${roleLabel} Telegram (optional)`}
          icon={FaTelegram}
          value={draft.spouseTelegram}
          placeholder="@username"
          disabled={disabled}
          onChange={(v) => setDraft((d) => ({ ...d, spouseTelegram: v }))}
        />
        <MessagingUsernameField
          id={`spouse-whatsapp-${slotIndex}`}
          label={`${roleLabel} WhatsApp (optional)`}
          icon={FaWhatsapp}
          value={draft.spouseWhatsApp}
          placeholder="@username or number"
          disabled={disabled}
          onChange={(v) => setDraft((d) => ({ ...d, spouseWhatsApp: v }))}
        />
        <div className="sm:col-span-2">
          <Label
            htmlFor={`partner-user-${slotIndex}`}
            className="text-xs text-[var(--muted-foreground)]"
          >
            SoulSync username (optional)
          </Label>
          <div className="mt-1">
            <UsernameMemberSuggestInput
              id={`partner-user-${slotIndex}`}
              value={draft.partnerUsername}
              onChange={(v) => setDraft((d) => ({ ...d, partnerUsername: v }))}
              placeholder="Link opposite-gender member for mutual confirmation"
              searchMembers={searchMarriagePartnerUsernames}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Children (optional)</Label>
          <button
            type="button"
            className={btnPrimaryOutlineMd}
            disabled={disabled}
            onClick={() =>
              setDraft((d) => ({
                ...d,
                children: [
                  ...d.children,
                  {
                    name: '',
                    gender: 'MALE',
                    dateOfBirth: '',
                    motherSlotIndex: slotIndex,
                  },
                ],
              }))
            }
          >
            Add child
          </button>
        </div>
        {draft.children.map((child, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border border-[var(--border)]/60 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]"
          >
            {showMotherSelect ? (
              <div className="sm:col-span-2 lg:col-span-1">
                <Label className="text-xs text-[var(--muted-foreground)]">Mother (wife)</Label>
                <select
                  className={cn(inputClass, 'mt-1')}
                  value={child.motherSlotIndex ?? slotIndex}
                  disabled={disabled}
                  onChange={(e) =>
                    updateChild(index, { motherSlotIndex: Number.parseInt(e.target.value, 10) })
                  }
                >
                  {wifeOptions.map((wife) => (
                    <option key={wife.slotIndex} value={wife.slotIndex}>
                      {wife.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <input
              className={inputClass}
              placeholder="Name"
              value={child.name}
              disabled={disabled}
              onChange={(e) => updateChild(index, { name: e.target.value })}
            />
            <select
              className={inputClass}
              value={child.gender}
              disabled={disabled}
              onChange={(e) =>
                updateChild(index, { gender: e.target.value as MarriageRecordChildDto['gender'] })
              }
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
            <IsoDatePicker
              value={child.dateOfBirth}
              onChange={(v) => updateChild(index, { dateOfBirth: v })}
              maxIso={dateToIso(new Date())}
              placeholder="Date of birth"
            />
            <button
              type="button"
              className={btnPrimaryOutlineMd}
              disabled={disabled}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  children: d.children.filter((_, i) => i !== index),
                }))
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className={btnPrimaryOutlineMd}
          disabled={saving || disabled}
          onClick={onCancelEdit}
        >
          Cancel
        </button>
        <button
          type="button"
          className={btnPrimaryOutlineMd}
          disabled={saving || disabled}
          onClick={() => void onSaveDraft()}
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          className={btnPrimaryMd}
          disabled={saving || disabled}
          onClick={onOpenConfirm}
        >
          Confirm marriage
        </button>
      </div>
    </div>
  );
}

export function MarriageRegistrySection({
  gender,
  profileCountry,
  disabled,
  sectionEditing = true,
}: {
  gender: Gender | null;
  profileCountry: string | null;
  disabled?: boolean;
  /** When false, only locked records (and draft summaries) are shown — no add/edit forms. */
  sectionEditing?: boolean;
}) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [records, setRecords] = React.useState<MarriageRecordDto[]>([]);
  const [archivedRecords, setArchivedRecords] = React.useState<MarriageRecordArchiveDto[]>([]);
  const [maxSlots, setMaxSlots] = React.useState(0);
  const [nextEditableSlot, setNextEditableSlot] = React.useState<number | null>(1);
  const [revealedSlots, setRevealedSlots] = React.useState<Set<number>>(() => new Set([1]));
  const [drafts, setDrafts] = React.useState<Record<number, DraftState>>({ 1: emptyDraft() });
  const [confirmSlot, setConfirmSlot] = React.useState<number | null>(null);
  const [editingSlots, setEditingSlots] = React.useState<Set<number>>(() => new Set());
  const [defaultPhoneCountry, setDefaultPhoneCountry] = React.useState<CountryCode>('BD');

  const load = React.useCallback(async () => {
    const data = await fetchMarriageRecords();
    setRecords(data.records);
    setArchivedRecords(data.archivedRecords ?? []);
    setMaxSlots(data.maxSlots);
    setNextEditableSlot(data.nextEditableSlot);
    const bySlot = new Map(data.records.map((r) => [r.slotIndex, r]));
    setDrafts((prev) => {
      const next = { ...prev };
      for (let slot = 1; slot <= data.maxSlots; slot += 1) {
        const record = bySlot.get(slot);
        if (record?.status === 'DRAFT' || !record) {
          next[slot] = draftFromRecord(record);
        }
      }
      return next;
    });
    const revealed = new Set<number>();
    for (let slot = 1; slot <= data.maxSlots; slot += 1) {
      const record = bySlot.get(slot);
      if (slot === 1 && (!record || record.status === 'DRAFT')) {
        revealed.add(1);
      }
      if (
        record &&
        isMarriageRecordSlotOccupiedForProgression(record.status) &&
        slot < data.maxSlots
      ) {
        revealed.add(slot + 1);
      }
      if (record?.status === 'DRAFT') {
        revealed.add(slot);
      }
    }
    if (data.nextEditableSlot != null) {
      revealed.add(data.nextEditableSlot);
    }
    if (revealed.size === 0 && data.maxSlots > 0) {
      revealed.add(1);
    }
    setRevealedSlots(revealed);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : 'Could not load marriage registry');
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

  React.useEffect(() => {
    let cancelled = false;
    void fetchCountries().then((list) => {
      if (cancelled || !profileCountry?.trim()) {
        return;
      }
      const match = list.find((c) => c.name.toLowerCase() === profileCountry.trim().toLowerCase());
      if (match?.alpha2 && isCountryCode(match.alpha2)) {
        setDefaultPhoneCountry(match.alpha2);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [profileCountry]);

  const saveDraft = async (slotIndex: number) => {
    const draft = drafts[slotIndex] ?? emptyDraft();
    setSaving(true);
    try {
      await upsertMarriageRecordDraft(slotIndex, {
        spouseName: draft.spouseName,
        marriageDate: draft.marriageDate,
        spousePhone: draft.spousePhone,
        spouseTelegram: draft.spouseTelegram,
        spouseWhatsApp: draft.spouseWhatsApp,
        partnerUsername: draft.partnerUsername,
        children: draft.children,
      });
      toast.success('Draft saved');
      setEditingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotIndex);
        return next;
      });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const runConfirm = async (slotIndex: number) => {
    const draft = drafts[slotIndex] ?? emptyDraft();
    setSaving(true);
    try {
      await upsertMarriageRecordDraft(slotIndex, {
        spouseName: draft.spouseName,
        marriageDate: draft.marriageDate,
        spousePhone: draft.spousePhone,
        spouseTelegram: draft.spouseTelegram,
        spouseWhatsApp: draft.spouseWhatsApp,
        partnerUsername: draft.partnerUsername,
        children: draft.children,
      });
      await confirmMarriageRecordSlot(slotIndex, { acknowledgeIrreversible: true });
      toast.success('Marriage confirmed and locked');
      setConfirmSlot(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Confirm failed');
    } finally {
      setSaving(false);
    }
  };

  const markStatus = async (recordId: string, status: 'DIVORCED' | 'DECEASED') => {
    try {
      await updateMarriageRecordStatus(recordId, { status });
      toast.success(status === 'DIVORCED' ? 'Marked as divorced' : 'Marked as deceased');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const startFemaleRemarriage = async () => {
    setSaving(true);
    try {
      await beginMarriageRemarriage(1);
      toast.success('You can add your new husband below');
      setEditingSlots(new Set([1]));
      setRevealedSlots(new Set([1]));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not start new entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading marriage registry…</p>;
  }

  if (maxSlots <= 0) {
    return (
      <p className="text-sm text-[var(--muted-foreground)]">
        Set your gender on biodata to use marriage confirmation.
      </p>
    );
  }

  const bySlot = new Map(records.map((r) => [r.slotIndex, r]));
  const wifeOptions = buildWifeOptions(gender, records, drafts, maxSlots);
  const wifeNameBySlot = new Map(
    wifeOptions.map((w) => [w.slotIndex, w.label.split(' — ')[1] ?? w.label]),
  );

  const pastRecords = records.filter((r) => r.status === 'DIVORCED' || r.status === 'DECEASED');
  const activeRecords = records.filter((r) => r.status === 'CONFIRMED');

  const showFemaleRemarriage =
    sectionEditing &&
    gender === 'FEMALE' &&
    records.some(
      (r) => r.slotIndex === 1 && (r.status === 'DIVORCED' || r.status === 'DECEASED'),
    ) &&
    !records.some((r) => r.status === 'CONFIRMED') &&
    nextEditableSlot == null;

  const addWifeCheckboxItems =
    sectionEditing && gender === 'MALE'
      ? Array.from({ length: maxSlots }, (_, i) => i + 1)
          .filter((slotIndex) => slotIndex > 1)
          .flatMap((slotIndex) => {
            const record = bySlot.get(slotIndex);
            if (record && record.status !== 'DRAFT') {
              return [];
            }
            const prev = bySlot.get(slotIndex - 1);
            if (!prev || !isMarriageRecordSlotOccupiedForProgression(prev.status)) {
              return [];
            }
            if (revealedSlots.has(slotIndex)) {
              return [];
            }
            return [
              <label key={slotIndex} className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={false}
                  disabled={disabled}
                  onChange={() => setRevealedSlots((s) => new Set(s).add(slotIndex))}
                />
                <span>{wantNextMarriageLabel(slotIndex)}</span>
              </label>,
            ];
          })
      : [];

  const addWifeCheckboxes =
    addWifeCheckboxItems.length > 0 ? (
      <div className="space-y-2 rounded-xl border border-[var(--border)]/60 bg-[var(--muted)]/10 p-4">
        <p className="text-sm font-semibold">Additional wives</p>
        <p className="text-muted-foreground text-xs">
          Check each box to add another wife (up to four). Your previous marriage in each slot must
          be confirmed or marked divorced/deceased first.
        </p>
        {addWifeCheckboxItems}
      </div>
    ) : null;

  const readSummaries = (
    <>
      {archivedRecords.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)]">Past marriages</h3>
          {archivedRecords.map((record) => (
            <ArchivedRecordView key={record.id} record={record} gender={gender} />
          ))}
        </div>
      ) : null}
      {pastRecords.length > 0 ? (
        <div className="space-y-3">
          {archivedRecords.length === 0 ? (
            <h3 className="text-sm font-semibold text-[var(--muted-foreground)]">Past marriages</h3>
          ) : null}
          {pastRecords.map((record) => (
            <LockedRecordView
              key={record.id}
              record={record}
              gender={gender}
              wifeNameBySlot={wifeNameBySlot}
              onStatus={(status) => markStatus(record.id, status)}
            />
          ))}
        </div>
      ) : null}
      {activeRecords.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Current marriage{activeRecords.length > 1 ? 's' : ''}
          </h3>
          {activeRecords.map((record) => (
            <LockedRecordView
              key={record.id}
              record={record}
              gender={gender}
              wifeNameBySlot={wifeNameBySlot}
              onStatus={(status) => markStatus(record.id, status)}
            />
          ))}
        </div>
      ) : null}
      {!sectionEditing
        ? Array.from({ length: maxSlots }, (_, i) => i + 1).map((slotIndex) => {
            const record = bySlot.get(slotIndex);
            if (record?.status !== 'DRAFT') {
              return null;
            }
            const role = gender === 'FEMALE' ? 'Husband' : 'Wife';
            const draft = drafts[slotIndex] ?? emptyDraft();
            return (
              <div
                key={slotIndex}
                className="rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/20 p-4 text-sm"
              >
                <p className="font-semibold">
                  {marriageRegistrySlotTitle(gender, slotIndex)} · draft
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {role}: {draft.spouseName.trim() || 'In progress'}
                  {draft.marriageDate ? ` · ${draft.marriageDate}` : ''}
                </p>
              </div>
            );
          })
        : null}
    </>
  );

  if (!sectionEditing) {
    return <div className="space-y-4">{readSummaries}</div>;
  }

  const draftForms = Array.from({ length: maxSlots }, (_, i) => i + 1).map((slotIndex) => {
    const record = bySlot.get(slotIndex);
    if (record && record.status !== 'DRAFT') {
      return null;
    }

    const prev = bySlot.get(slotIndex - 1);
    if (slotIndex > 1 && gender === 'MALE') {
      if (!prev || !isMarriageRecordSlotOccupiedForProgression(prev.status)) {
        return null;
      }
    }

    if (slotIndex > 1 && !revealedSlots.has(slotIndex)) {
      return null;
    }

    if (
      gender === 'FEMALE' &&
      record &&
      (record.status === 'DIVORCED' || record.status === 'DECEASED')
    ) {
      return null;
    }

    if (record?.status === 'DRAFT' || !record || slotIndex === 1) {
      const draft = drafts[slotIndex] ?? emptyDraft();
      if (!editingSlots.has(slotIndex)) {
        return (
          <SlotDraftSummary
            key={slotIndex}
            slotIndex={slotIndex}
            gender={gender}
            draft={draft}
            record={record}
            disabled={disabled}
            onEdit={() => setEditingSlots((s) => new Set(s).add(slotIndex))}
          />
        );
      }
      return (
        <SlotDraftForm
          key={slotIndex}
          slotIndex={slotIndex}
          gender={gender}
          draft={draft}
          wifeOptions={wifeOptions}
          setDraft={(updater) =>
            setDrafts((prev) => ({
              ...prev,
              [slotIndex]:
                typeof updater === 'function' ? updater(prev[slotIndex] ?? emptyDraft()) : updater,
            }))
          }
          defaultPhoneCountry={defaultPhoneCountry}
          disabled={disabled}
          saving={saving}
          onSaveDraft={() => saveDraft(slotIndex)}
          onOpenConfirm={() => setConfirmSlot(slotIndex)}
          onCancelEdit={() =>
            setEditingSlots((s) => {
              const next = new Set(s);
              next.delete(slotIndex);
              return next;
            })
          }
        />
      );
    }
    return null;
  });

  return (
    <div className="space-y-6">
      {readSummaries}
      {showFemaleRemarriage ? (
        <button
          type="button"
          className={btnPrimaryMd}
          disabled={disabled || saving}
          onClick={() => void startFemaleRemarriage()}
        >
          Add new husband
        </button>
      ) : null}
      {addWifeCheckboxes}
      <div className="space-y-4">{draftForms}</div>

      <AlertDialog
        open={confirmSlot != null}
        onOpenChange={(open) => !open && setConfirmSlot(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm marriage permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              After you confirm, you cannot edit or delete this marriage information. You may only
              mark the marriage as divorced or deceased later. History will remain on your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmSlot != null && void runConfirm(confirmSlot)}>
              I understand, confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
