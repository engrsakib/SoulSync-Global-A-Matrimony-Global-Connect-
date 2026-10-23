'use client';

import type { Gender } from '@soulsync/shared-types/partner-preference';
import type {
  MarriageRecordArchiveDto,
  MarriageRecordChildDto,
  MarriageRecordDto,
} from '@soulsync/shared-types/marriage-record';
import { canUpdateChildrenOnMarriageRecord } from '@soulsync/shared-types/marriage-record';
import { cn } from '@soulsync/ui/lib/utils';
import { btnPrimaryOutlineMd } from '@/lib/ui-classes';

export const marriageChildInputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

export type MarriageChildWifeOption = {
  slotIndex: number;
  /** Display name + ordinal, e.g. "saraban · first wife" */
  label: string;
  linkedOnSoulSync: boolean;
};

export function formatMotherWifeOptionLabel(
  wife: MarriageChildWifeOption,
  opts?: { statusLabel?: string },
): string {
  const parts = [wife.label];
  if (!wife.linkedOnSoulSync) {
    parts.push('Not on SoulSync');
  }
  if (opts?.statusLabel) {
    parts.push(opts.statusLabel);
  }
  return parts.join(' · ');
}

const WIFE_ORDINALS = ['first', 'second', 'third', 'fourth'] as const;

export function isRegistryRecordLinkedOnSoulSync(record: {
  linkedPartnerUserId?: string | null;
  partnerUsername?: string | null;
}): boolean {
  return Boolean(record.linkedPartnerUserId || record.partnerUsername?.trim());
}

export type RegistrySpouseLabelInput = {
  gender: Gender | null;
  spouseName: string | null | undefined;
  slotIndex: number;
  linkedOnSoulSync: boolean;
  /** When set, appended like the mother dropdown (e.g. " · Divorced"). */
  recordStatus?: MarriageRecordDto['status'];
};

/** Same segments as the add-child mother `<select>` options. */
export function formatRegistrySpouseOptionLabel(input: RegistrySpouseLabelInput): string {
  const name = input.spouseName?.trim();
  let baseLabel: string;
  if (input.gender === 'FEMALE') {
    baseLabel = name || 'Husband';
  } else {
    const ord = WIFE_ORDINALS[input.slotIndex - 1] ?? `${input.slotIndex}`;
    baseLabel = name ? `${name} · ${ord} wife` : `${ord} wife`;
  }
  const wifeOption: MarriageChildWifeOption = {
    slotIndex: input.slotIndex,
    label: baseLabel,
    linkedOnSoulSync: input.linkedOnSoulSync,
  };
  return formatMotherWifeOptionLabel(wifeOption, {
    statusLabel: input.recordStatus ? motherSlotStatusLabel(input.recordStatus) : undefined,
  });
}

export function registrySpouseLabelFromMarriageRecord(
  gender: Gender | null,
  record: Pick<
    MarriageRecordDto,
    'spouseName' | 'slotIndex' | 'status' | 'linkedPartnerUserId' | 'partnerUsername'
  >,
  opts?: { includeStatus?: boolean },
): string {
  return formatRegistrySpouseOptionLabel({
    gender,
    spouseName: record.spouseName,
    slotIndex: record.slotIndex,
    linkedOnSoulSync: isRegistryRecordLinkedOnSoulSync(record),
    recordStatus: opts?.includeStatus === false ? undefined : record.status,
  });
}

export function registrySpouseLabelFromArchive(
  gender: Gender | null,
  archive: MarriageRecordArchiveDto,
  opts?: { includeStatus?: boolean },
): string {
  return formatRegistrySpouseOptionLabel({
    gender,
    spouseName: archive.spouseName,
    slotIndex: archive.originalSlotIndex,
    linkedOnSoulSync: isRegistryRecordLinkedOnSoulSync(archive),
    recordStatus: opts?.includeStatus === false ? undefined : archive.endedStatus,
  });
}

export function motherSlotStatusLabel(
  status: MarriageRecordDto['status'] | undefined,
): string | undefined {
  if (status === 'CONFIRMED') {
    return 'Current marriage';
  }
  if (status === 'DIVORCED') {
    return 'Divorced';
  }
  if (status === 'DECEASED') {
    return 'Deceased';
  }
  if (status === 'DRAFT') {
    return 'Draft';
  }
  return undefined;
}

/** @deprecated Use canUpdateChildrenOnMotherSlot */
export function isMotherSlotLocked(motherSlotIndex: number, records: MarriageRecordDto[]): boolean {
  return !canUpdateChildrenOnMotherSlot(motherSlotIndex, records);
}

export function canUpdateChildrenOnMotherSlot(
  motherSlotIndex: number,
  records: MarriageRecordDto[],
): boolean {
  const record = records.find((r) => r.slotIndex === motherSlotIndex);
  if (!record) {
    return true;
  }
  return canUpdateChildrenOnMarriageRecord(record.status);
}

type MarriageChildRowProps = {
  index: number;
  child: MarriageRecordChildDto;
  wifeOptions: MarriageChildWifeOption[];
  showMotherSelect: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

export function MarriageChildRow({
  index,
  child,
  wifeOptions,
  showMotherSelect,
  readOnly = false,
  disabled = false,
  onEdit,
  onRemove,
}: MarriageChildRowProps) {
  const motherSlot = child.motherSlotIndex ?? 1;
  const motherLabel =
    wifeOptions.find((w) => w.slotIndex === motherSlot)?.label ?? `Wife slot ${motherSlot}`;

  const genderLabel = child.gender === 'FEMALE' ? 'Female' : 'Male';

  if (readOnly) {
    return (
      <li className="rounded-lg border border-[var(--border)]/60 bg-[var(--muted)]/15 p-4">
        <p className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
          Child {index + 1}
        </p>
        <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
          {child.name.trim() || '—'} · {genderLabel} · DOB {child.dateOfBirth || '—'}
        </p>
        {showMotherSelect ? (
          <p className="text-muted-foreground mt-1 text-xs">Mother: {motherLabel}</p>
        ) : null}
        <p className="text-muted-foreground mt-1 text-xs">From a confirmed marriage (read-only)</p>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-[var(--border)]/70 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[var(--muted-foreground)]">Child {index + 1}</p>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">
          {child.name.trim() || 'Unnamed'}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {genderLabel} · Born {child.dateOfBirth || '—'}
          {showMotherSelect ? ` · ${motherLabel}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button type="button" className={btnPrimaryOutlineMd} disabled={disabled} onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className={cn(
            btnPrimaryOutlineMd,
            'border-red-200 text-red-800 hover:bg-red-50 dark:border-red-900/40 dark:text-red-200',
          )}
          disabled={disabled}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>
    </li>
  );
}
