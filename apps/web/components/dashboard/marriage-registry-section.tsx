'use client';

import * as React from 'react';
import type { Gender } from '@soulsync/shared-types/partner-preference';
import type {
  MarriageRecordChildDto,
  MarriageRecordDto,
} from '@soulsync/shared-types/marriage-record';
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
import {
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

function slotTitle(gender: Gender | null, slotIndex: number): string {
  const role = gender === 'FEMALE' ? 'husband' : 'wife';
  if (gender === 'FEMALE') {
    return 'Confirm marriage (husband)';
  }
  const ord = ORDINALS[slotIndex - 1] ?? `${slotIndex}`;
  return `Confirm ${ord} marriage (${role})`;
}

function wantNextMarriageLabel(slotIndex: number): string {
  const ord = ORDINALS[slotIndex - 1] ?? `${slotIndex}`;
  return `I want a ${ord} marriage`;
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

function LockedRecordView({
  record,
  gender,
  onStatus,
}: {
  record: MarriageRecordDto;
  gender: Gender | null;
  onStatus: (status: 'DIVORCED' | 'DECEASED') => Promise<void>;
}) {
  const role = gender === 'FEMALE' ? 'Husband' : 'Wife';
  return (
    <div className="rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">
            {slotTitle(gender, record.slotIndex)} · {record.status.toLowerCase()}
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
        {record.status === 'CONFIRMED' ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnPrimaryOutlineMd}
              onClick={() => void onStatus('DIVORCED')}
            >
              Mark divorced
            </button>
            <button
              type="button"
              className={btnPrimaryOutlineMd}
              onClick={() => void onStatus('DECEASED')}
            >
              Mark deceased
            </button>
          </div>
        ) : null}
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
  saving,
}: {
  slotIndex: number;
  gender: Gender | null;
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState>>;
  defaultPhoneCountry: CountryCode;
  disabled?: boolean;
  onSaveDraft: () => Promise<void>;
  onOpenConfirm: () => void;
  saving: boolean;
}) {
  const roleLabel = gender === 'FEMALE' ? 'Husband' : 'Wife';

  const updateChild = (index: number, patch: Partial<MarriageRecordChildDto>) => {
    setDraft((current) => ({
      ...current,
      children: current.children.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-brand-700)]/25 p-4">
      <h3 className="text-sm font-semibold">{slotTitle(gender, slotIndex)}</h3>
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
                children: [...d.children, { name: '', gender: 'MALE', dateOfBirth: '' }],
              }))
            }
          >
            Add child
          </button>
        </div>
        {draft.children.map((child, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-lg border border-[var(--border)]/60 p-3 sm:grid-cols-[1fr_auto_auto_auto]"
          >
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
}: {
  gender: Gender | null;
  profileCountry: string | null;
  disabled?: boolean;
}) {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [records, setRecords] = React.useState<MarriageRecordDto[]>([]);
  const [maxSlots, setMaxSlots] = React.useState(0);
  const [revealedSlots, setRevealedSlots] = React.useState<Set<number>>(() => new Set([1]));
  const [drafts, setDrafts] = React.useState<Record<number, DraftState>>({ 1: emptyDraft() });
  const [confirmSlot, setConfirmSlot] = React.useState<number | null>(null);
  const [defaultPhoneCountry, setDefaultPhoneCountry] = React.useState<CountryCode>('BD');

  const load = React.useCallback(async () => {
    const data = await fetchMarriageRecords();
    setRecords(data.records);
    setMaxSlots(data.maxSlots);
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
      if (record?.status === 'CONFIRMED' && slot < data.maxSlots) {
        revealed.add(slot + 1);
      }
      if (record?.status === 'DRAFT') {
        revealed.add(slot);
      }
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

  return (
    <div className="mt-6 space-y-6">
      {Array.from({ length: maxSlots }, (_, i) => i + 1).map((slotIndex) => {
        const record = bySlot.get(slotIndex);
        if (record && record.status !== 'DRAFT') {
          return (
            <LockedRecordView
              key={slotIndex}
              record={record}
              gender={gender}
              onStatus={(status) => markStatus(record.id, status)}
            />
          );
        }

        const prev = bySlot.get(slotIndex - 1);
        if (slotIndex > 1 && gender === 'MALE') {
          if (!prev || prev.status !== 'CONFIRMED') {
            return null;
          }
          if (!revealedSlots.has(slotIndex)) {
            return (
              <label key={slotIndex} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => setRevealedSlots((s) => new Set(s).add(slotIndex))}
                />
                {wantNextMarriageLabel(slotIndex)}
              </label>
            );
          }
        }

        if (slotIndex > 1 && !revealedSlots.has(slotIndex)) {
          return null;
        }

        if (record?.status === 'DRAFT' || !record || slotIndex === 1) {
          const draft = drafts[slotIndex] ?? emptyDraft();
          return (
            <SlotDraftForm
              key={slotIndex}
              slotIndex={slotIndex}
              gender={gender}
              draft={draft}
              setDraft={(updater) =>
                setDrafts((prev) => ({
                  ...prev,
                  [slotIndex]:
                    typeof updater === 'function'
                      ? updater(prev[slotIndex] ?? emptyDraft())
                      : updater,
                }))
              }
              defaultPhoneCountry={defaultPhoneCountry}
              disabled={disabled}
              saving={saving}
              onSaveDraft={() => saveDraft(slotIndex)}
              onOpenConfirm={() => setConfirmSlot(slotIndex)}
            />
          );
        }
        return null;
      })}

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
