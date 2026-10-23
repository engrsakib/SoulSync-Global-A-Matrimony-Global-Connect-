'use client';

import * as React from 'react';
import type { Gender } from '@soulsync/shared-types/partner-preference';
import type {
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
  MarriageStatusBadge,
  marriageStatusBadgeVariantFromRecordStatus,
} from '@/components/dashboard/marriage-status-badge';
import {
  beginMarriageRemarriage,
  confirmMarriageRecordSlot,
  deleteMarriageRecordDraft,
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
import {
  buildFamilyChildrenFromRecords,
  countChildrenForMotherSlot,
  MarriageRegistryFamilyChildren,
} from '@/components/dashboard/marriage-registry-family-children';
import { MarriageRecordEndStatusDialog } from '@/components/dashboard/marriage-record-end-status-dialog';
import type { MarriageChildWifeOption } from '@/components/dashboard/marriage-child-row';
import { UserRound } from 'lucide-react';

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

function reopenEndedWifeSlotLabel(slotIndex: number): string {
  const ord = ORDINALS[slotIndex - 1] ?? `${slotIndex}`;
  return `Add a new ${ord} wife (this slot was divorced or deceased)`;
}

type WifeOption = MarriageChildWifeOption;

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
    const linkedOnSoulSync = Boolean(
      record?.linkedPartnerUserId ||
      record?.partnerUsername?.trim() ||
      draft?.partnerUsername.trim(),
    );
    options.push({
      slotIndex: slot,
      label: `${name} · ${ord} wife`,
      linkedOnSoulSync,
    });
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
};

function emptyDraft(): DraftState {
  return {
    spouseName: '',
    marriageDate: '',
    spousePhone: '',
    spouseTelegram: '',
    spouseWhatsApp: '',
    partnerUsername: '',
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
  };
}

function buildDraftForSlot(record: MarriageRecordDto | undefined): DraftState {
  return draftFromRecord(record);
}

function draftHasLocalEdits(draft: DraftState | undefined): boolean {
  if (!draft) {
    return false;
  }
  return Boolean(
    draft.spouseName.trim() ||
    draft.marriageDate.trim() ||
    draft.spousePhone.trim() ||
    draft.partnerUsername.trim(),
  );
}

export function RegistryHistoryEntry({
  displayLabel,
  marriageDate,
  statusEndedDate,
  endedStatus,
  childRecords = [],
}: {
  /** e.g. saraban · first wife · Not on SoulSync (status on badge) */
  displayLabel: string;
  marriageDate: string | null;
  statusEndedDate?: string | null;
  endedStatus: 'DIVORCED' | 'DECEASED';
  childRecords?: MarriageRecordChildDto[];
}) {
  const statusLabel = endedStatus === 'DIVORCED' ? 'Divorced' : 'Deceased';
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-[var(--border)]/70 bg-[var(--muted)]/15 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)]/10 ring-2 ring-[var(--background)]">
          <UserRound className="h-5 w-5 text-[var(--color-brand-800)]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--foreground)]">{displayLabel}</p>
            <MarriageStatusBadge
              label={statusLabel}
              variant={marriageStatusBadgeVariantFromRecordStatus(endedStatus)}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Marriage date: {marriageDate ?? '—'}
            {statusEndedDate
              ? ` · ${endedStatus === 'DECEASED' ? 'Passed' : 'Divorced'}: ${statusEndedDate}`
              : ''}
            {' · Private registry entry'}
          </p>
        </div>
      </div>
      {childRecords.length > 0 ? (
        <ul className="w-full space-y-1 text-xs text-[var(--foreground)] sm:max-w-xs sm:text-right">
          {childRecords.map((child, index) => (
            <li key={`${child.name}-${index}`}>
              Child: {child.name} ({child.gender}) · DOB {child.dateOfBirth}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function MarriageRegistryLockedRecordView({
  record,
  gender,
  onRequestEndStatus,
  wifeNameBySlot,
  readOnly = false,
}: {
  record: MarriageRecordDto;
  gender: Gender | null;
  onRequestEndStatus?: (mode: 'divorced' | 'deceased') => void;
  wifeNameBySlot?: Map<number, string>;
  readOnly?: boolean;
}) {
  const role = gender === 'FEMALE' ? 'Husband' : 'Wife';
  return (
    <div className="rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/20 p-4 shadow-sm">
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">
              {marriageRegistrySlotTitle(gender, record.slotIndex)}
            </p>
            <MarriageStatusBadge
              label={record.status === 'CONFIRMED' ? 'Confirmed' : record.status.toLowerCase()}
              variant={marriageStatusBadgeVariantFromRecordStatus(record.status)}
            />
          </div>
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
        {record.status === 'CONFIRMED' && !readOnly && onRequestEndStatus ? (
          <MarriageEndActionsMenu
            onMarkDivorced={() => onRequestEndStatus('divorced')}
            onMarkDeceased={() => onRequestEndStatus('deceased')}
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
  onDiscardDraft,
  disabled,
  childCount,
}: {
  slotIndex: number;
  gender: Gender | null;
  draft: DraftState;
  record: MarriageRecordDto | undefined;
  onEdit: () => void | Promise<void>;
  onDiscardDraft?: () => void;
  disabled?: boolean;
  childCount: number;
}) {
  const role = gender === 'FEMALE' ? 'Husband' : 'Wife';
  const hasDraft = record?.status === 'DRAFT' || draftHasLocalEdits(draft);
  const childNote = childCount > 0 ? ` · ${childCount} child${childCount === 1 ? '' : 'ren'}` : '';
  const summary = hasDraft
    ? `${draft.spouseName.trim() || 'Draft in progress'}${draft.marriageDate ? ` · ${draft.marriageDate}` : ''}${childNote}`
    : 'Not started — click Edit to add.';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)]/80 bg-[var(--background)] p-4">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{marriageRegistrySlotTitle(gender, slotIndex)}</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          {role}: {summary}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {record?.status === 'DRAFT' && onDiscardDraft ? (
          <button
            type="button"
            className={cn(
              btnPrimaryOutlineMd,
              'border-red-200 text-red-800 hover:bg-red-50 dark:border-red-900/50 dark:text-red-200 dark:hover:bg-red-950/40',
            )}
            disabled={disabled}
            onClick={onDiscardDraft}
          >
            Delete draft
          </button>
        ) : null}
        <button
          type="button"
          className={btnPrimaryOutlineMd}
          disabled={disabled}
          onClick={() => void onEdit()}
        >
          Edit
        </button>
      </div>
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
  onDiscardDraft,
  saving,
  familyChildrenDirty,
  canDiscardSavedDraft,
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
  onDiscardDraft?: () => void;
  saving: boolean;
  familyChildrenDirty: boolean;
  canDiscardSavedDraft: boolean;
}) {
  const roleLabel = gender === 'FEMALE' ? 'Husband' : 'Wife';
  const [contactOpen, setContactOpen] = React.useState(
    Boolean(draft.spousePhone.trim() || draft.spouseTelegram.trim() || draft.spouseWhatsApp.trim()),
  );
  const [linkOpen, setLinkOpen] = React.useState(Boolean(draft.partnerUsername.trim()));
  const actionBtnClass = 'w-full sm:w-auto';

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
      </div>

      <div className="space-y-2">
        <button
          type="button"
          className="text-sm font-medium text-[var(--color-brand-700)] underline-offset-2 hover:underline"
          onClick={() => setContactOpen((open) => !open)}
        >
          {contactOpen ? 'Hide' : 'Show'} contact (optional)
        </button>
        {contactOpen ? (
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          className="text-sm font-medium text-[var(--color-brand-700)] underline-offset-2 hover:underline"
          onClick={() => setLinkOpen((open) => !open)}
        >
          {linkOpen ? 'Hide' : 'Show'} SoulSync link (optional)
        </button>
        {linkOpen ? (
          <div>
            <Label
              htmlFor={`partner-user-${slotIndex}`}
              className="text-xs text-[var(--muted-foreground)]"
            >
              SoulSync username
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
        ) : null}
      </div>

      {familyChildrenDirty ? (
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Save family children below before confirming this marriage.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
        {canDiscardSavedDraft && onDiscardDraft ? (
          <button
            type="button"
            className={cn(
              btnPrimaryOutlineMd,
              actionBtnClass,
              'border-red-200 text-red-800 hover:bg-red-50 dark:border-red-900/50 dark:text-red-200 dark:hover:bg-red-950/40',
            )}
            disabled={saving || disabled}
            onClick={onDiscardDraft}
          >
            Delete draft
          </button>
        ) : null}
        <button
          type="button"
          className={cn(btnPrimaryOutlineMd, actionBtnClass)}
          disabled={saving || disabled}
          onClick={onCancelEdit}
        >
          Cancel
        </button>
        <button
          type="button"
          className={cn(btnPrimaryOutlineMd, actionBtnClass)}
          disabled={saving || disabled}
          onClick={() => void onSaveDraft()}
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button
          type="button"
          className={cn(btnPrimaryMd, actionBtnClass)}
          disabled={saving || disabled || familyChildrenDirty}
          title={familyChildrenDirty ? 'Save family children before confirming' : undefined}
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
  onRegistryUpdated,
}: {
  gender: Gender | null;
  profileCountry: string | null;
  disabled?: boolean;
  /** When false, only locked records (and draft summaries) are shown — no add/edit forms. */
  sectionEditing?: boolean;
  /** Called after registry data changes (save, confirm, delete draft, etc.). */
  onRegistryUpdated?: () => void;
}) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [records, setRecords] = React.useState<MarriageRecordDto[]>([]);
  const [maxSlots, setMaxSlots] = React.useState(0);
  const [nextEditableSlot, setNextEditableSlot] = React.useState<number | null>(1);
  const [revealedSlots, setRevealedSlots] = React.useState<Set<number>>(() => new Set([1]));
  const [drafts, setDrafts] = React.useState<Record<number, DraftState>>({ 1: emptyDraft() });
  const [confirmSlot, setConfirmSlot] = React.useState<number | null>(null);
  const [discardDraftSlot, setDiscardDraftSlot] = React.useState<number | null>(null);
  const [editingSlots, setEditingSlots] = React.useState<Set<number>>(() => new Set());
  const [defaultPhoneCountry, setDefaultPhoneCountry] = React.useState<CountryCode>('BD');
  const [familyChildrenDirty, setFamilyChildrenDirty] = React.useState(false);
  const [endStatusRequest, setEndStatusRequest] = React.useState<{
    recordId: string;
    mode: 'divorced' | 'deceased';
    spouseLabel: string;
    marriageDate: string | null;
  } | null>(null);
  const load = React.useCallback(async () => {
    const data = await fetchMarriageRecords();
    setRecords(data.records);
    setMaxSlots(data.maxSlots);
    setNextEditableSlot(data.nextEditableSlot);
    const bySlot = new Map(data.records.map((r) => [r.slotIndex, r]));
    setDrafts((prev) => {
      const next = { ...prev };
      for (let slot = 1; slot <= data.maxSlots; slot += 1) {
        const record = bySlot.get(slot);
        if (record?.status === 'DRAFT') {
          next[slot] = buildDraftForSlot(record);
        } else if (!record) {
          next[slot] = draftHasLocalEdits(prev[slot]) ? (prev[slot] ?? emptyDraft()) : emptyDraft();
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
    return data;
  }, []);

  const reloadAndNotifyParent = React.useCallback(async () => {
    await load();
    onRegistryUpdated?.();
  }, [load, onRegistryUpdated]);

  const openSlotForEdit = React.useCallback(
    async (slotIndex: number) => {
      try {
        let data = await load();
        let bySlot = new Map(data.records.map((r) => [r.slotIndex, r]));
        const record = bySlot.get(slotIndex);
        if (record?.status === 'DIVORCED' || record?.status === 'DECEASED') {
          await beginMarriageRemarriage(slotIndex);
          data = await load();
          bySlot = new Map(data.records.map((r) => [r.slotIndex, r]));
        }
        setDrafts((prev) => ({
          ...prev,
          [slotIndex]: buildDraftForSlot(bySlot.get(slotIndex)),
        }));
        setRevealedSlots((s) => new Set(s).add(slotIndex));
        setEditingSlots(new Set([slotIndex]));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not refresh marriage data');
      }
    },
    [load],
  );

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
      });
      toast.success('Draft saved');
      setEditingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotIndex);
        return next;
      });
      await reloadAndNotifyParent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const requestDiscardDraft = (slotIndex: number) => {
    setDiscardDraftSlot(slotIndex);
  };

  const runDiscardDraft = async () => {
    if (discardDraftSlot == null) {
      return;
    }
    const slotIndex = discardDraftSlot;
    setSaving(true);
    try {
      await deleteMarriageRecordDraft(slotIndex);
      toast.success('Draft deleted permanently');
      setDiscardDraftSlot(null);
      setDrafts((prev) => ({ ...prev, [slotIndex]: emptyDraft() }));
      setEditingSlots((prev) => {
        const next = new Set(prev);
        next.delete(slotIndex);
        return next;
      });
      await reloadAndNotifyParent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete draft');
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
      });
      await confirmMarriageRecordSlot(slotIndex, { acknowledgeIrreversible: true });
      toast.success('Marriage confirmed and locked');
      setConfirmSlot(null);
      await reloadAndNotifyParent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Confirm failed');
    } finally {
      setSaving(false);
    }
  };

  const markStatus = async (
    recordId: string,
    status: 'DIVORCED' | 'DECEASED',
    statusEndedDate: string,
  ) => {
    try {
      await updateMarriageRecordStatus(recordId, { status, statusEndedDate });
      toast.success(status === 'DIVORCED' ? 'Marked as divorced' : 'Marked as deceased');
      setEndStatusRequest(null);
      await reloadAndNotifyParent();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const draftMarriageDatesBySlot = React.useMemo(() => {
    const map: Record<number, string> = {};
    for (let slot = 1; slot <= maxSlots; slot += 1) {
      const date = drafts[slot]?.marriageDate?.trim();
      if (date) {
        map[slot] = date;
      }
    }
    return map;
  }, [drafts, maxSlots]);

  const startFemaleRemarriage = async () => {
    setSaving(true);
    try {
      await beginMarriageRemarriage(1);
      toast.success('You can add your new husband below');
      setEditingSlots(new Set([1]));
      setRevealedSlots(new Set([1]));
      await reloadAndNotifyParent();
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
    wifeOptions.map((w) => [w.slotIndex, w.label.split(' · ')[0]?.trim() ?? w.label]),
  );

  const activeRecords = records.filter((r) => r.status === 'CONFIRMED');
  const confirmedWifeCount = activeRecords.length;
  const familyChildren = buildFamilyChildrenFromRecords(records);
  const hasEditableDraftSlot =
    records.some((r) => r.status === 'DRAFT') || nextEditableSlot != null;

  const showFemaleRemarriage =
    sectionEditing &&
    gender === 'FEMALE' &&
    records.some(
      (r) => r.slotIndex === 1 && (r.status === 'DIVORCED' || r.status === 'DECEASED'),
    ) &&
    !records.some((r) => r.status === 'CONFIRMED') &&
    nextEditableSlot == null;

  const reopenEndedWifeSlotItems =
    sectionEditing && gender === 'MALE' && confirmedWifeCount < maxSlots
      ? Array.from({ length: maxSlots }, (_, i) => i + 1).flatMap((slotIndex) => {
          const record = bySlot.get(slotIndex);
          if (!record || (record.status !== 'DIVORCED' && record.status !== 'DECEASED')) {
            return [];
          }
          if (revealedSlots.has(slotIndex) || editingSlots.has(slotIndex)) {
            return [];
          }
          return [
            <label
              key={`reopen-${slotIndex}`}
              className="flex cursor-pointer items-start gap-2 text-sm"
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={false}
                disabled={disabled}
                onChange={() => void openSlotForEdit(slotIndex)}
              />
              <span>{reopenEndedWifeSlotLabel(slotIndex)}</span>
            </label>,
          ];
        })
      : [];

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
            if (confirmedWifeCount >= maxSlots) {
              return [];
            }
            return [
              <label key={slotIndex} className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={false}
                  disabled={disabled}
                  onChange={() => {
                    setRevealedSlots((s) => new Set(s).add(slotIndex));
                    void openSlotForEdit(slotIndex);
                  }}
                />
                <span>{wantNextMarriageLabel(slotIndex)}</span>
              </label>,
            ];
          })
      : [];

  const addWifeCheckboxes =
    reopenEndedWifeSlotItems.length > 0 || addWifeCheckboxItems.length > 0 ? (
      <div className="space-y-2 rounded-xl border border-[var(--border)]/60 bg-[var(--muted)]/10 p-4">
        <p className="text-sm font-semibold">Add wives</p>
        <p className="text-muted-foreground text-xs">
          Up to four confirmed wives at once. Divorced or deceased slots can be reused; ended
          marriages stay in History.
        </p>
        {reopenEndedWifeSlotItems}
        {addWifeCheckboxItems}
      </div>
    ) : null;

  const readSummaries = (
    <>
      {activeRecords.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            Current marriage{activeRecords.length > 1 ? 's' : ''}
          </h3>
          {activeRecords.map((record) => (
            <MarriageRegistryLockedRecordView
              key={record.id}
              record={record}
              gender={gender}
              wifeNameBySlot={wifeNameBySlot}
              onRequestEndStatus={(mode) =>
                setEndStatusRequest({
                  recordId: record.id,
                  mode,
                  spouseLabel: record.spouseName?.trim() || 'your spouse',
                  marriageDate: record.marriageDate,
                })
              }
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
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/20 p-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {marriageRegistrySlotTitle(gender, slotIndex)} · draft
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {role}: {draft.spouseName.trim() || 'In progress'}
                    {draft.marriageDate ? ` · ${draft.marriageDate}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className={cn(
                    btnPrimaryOutlineMd,
                    'border-red-200 text-red-800 hover:bg-red-50 dark:border-red-900/50 dark:text-red-200 dark:hover:bg-red-950/40',
                  )}
                  disabled={disabled || saving}
                  onClick={() => requestDiscardDraft(slotIndex)}
                >
                  Delete draft
                </button>
              </div>
            );
          })
        : null}
    </>
  );

  if (!sectionEditing) {
    return (
      <div className="space-y-4">
        {readSummaries}
        <AlertDialog
          open={discardDraftSlot != null}
          onOpenChange={(open) => !open && setDiscardDraftSlot(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete marriage draft permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes saved draft details for this slot (spouse name, date, contact, and
                children on this draft). Confirmed marriages are not affected. This cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={saving}
                className="bg-red-700 hover:bg-red-800"
                onClick={() => void runDiscardDraft()}
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
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
            childCount={countChildrenForMotherSlot(familyChildren, slotIndex)}
            onEdit={() => openSlotForEdit(slotIndex)}
            onDiscardDraft={
              record?.status === 'DRAFT'
                ? () => requestDiscardDraft(slotIndex)
                : undefined
            }
          />
        );
      }
      return (
        <SlotDraftForm
          key={slotIndex}
          slotIndex={slotIndex}
          gender={gender}
          draft={draft}
          familyChildrenDirty={familyChildrenDirty}
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
          onCancelEdit={() => {
            setDrafts((prev) => ({
              ...prev,
              [slotIndex]: buildDraftForSlot(bySlot.get(slotIndex)),
            }));
            setEditingSlots((s) => {
              const next = new Set(s);
              next.delete(slotIndex);
              return next;
            });
          }}
          canDiscardSavedDraft={record?.status === 'DRAFT'}
          onDiscardDraft={
            record?.status === 'DRAFT' ? () => requestDiscardDraft(slotIndex) : undefined
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

      <MarriageRegistryFamilyChildren
        key={records.map((r) => `${r.id}:${r.updatedAt}`).join('|')}
        records={records}
        maxSlots={maxSlots}
        wifeOptions={wifeOptions}
        showMotherSelect={gender === 'MALE' && maxSlots > 1}
        disabled={disabled}
        hasEditableDraftSlot={hasEditableDraftSlot}
        draftMarriageDatesBySlot={draftMarriageDatesBySlot}
        onSaved={async () => {
          await reloadAndNotifyParent();
        }}
        onDirtyChange={setFamilyChildrenDirty}
      />

      <MarriageRecordEndStatusDialog
        key={
          endStatusRequest
            ? `${endStatusRequest.recordId}-${endStatusRequest.mode}`
            : 'marriage-end-closed'
        }
        open={endStatusRequest != null}
        mode={endStatusRequest?.mode ?? 'divorced'}
        spouseLabel={endStatusRequest?.spouseLabel ?? ''}
        marriageDate={endStatusRequest?.marriageDate ?? null}
        onOpenChange={(open) => !open && setEndStatusRequest(null)}
        onConfirm={(statusEndedDate) => {
          if (!endStatusRequest) {
            return;
          }
          void markStatus(
            endStatusRequest.recordId,
            endStatusRequest.mode === 'divorced' ? 'DIVORCED' : 'DECEASED',
            statusEndedDate,
          );
        }}
      />

      <AlertDialog
        open={discardDraftSlot != null}
        onOpenChange={(open) => !open && setDiscardDraftSlot(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete marriage draft permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes saved draft details for this slot (spouse name, date, contact, and
              children on this draft). Confirmed marriages are not affected. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              className="bg-red-700 hover:bg-red-800"
              onClick={() => void runDiscardDraft()}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
