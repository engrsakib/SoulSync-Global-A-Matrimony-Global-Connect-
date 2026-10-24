'use client';

import * as React from 'react';
import type { Gender } from '@soulsync/shared-types/partner-preference';
import type {
  MarriageRecordArchiveDto,
  MarriageRecordChildDto,
  MarriageRecordDto,
} from '@soulsync/shared-types/marriage-record';
import {
  canUpdateChildrenOnMarriageRecord,
  flattenRegistryFamilyChildren,
  groupChildrenByMotherSlot,
  validateMarriageRecordChildrenBatch,
  type UpsertMarriageRecordChildrenBatchDto,
} from '@soulsync/shared-types/marriage-record';
import { toast } from 'sonner';
import {
  MarriageChildRow,
  type MarriageChildWifeOption,
} from '@/components/dashboard/marriage-child-row';
import {
  childToFormValues,
  emptyChildFormValues,
  formValuesToChild,
  MarriageChildFormPanel,
  type MarriageChildFormValues,
} from '@/components/dashboard/marriage-child-form';
import { cn } from '@soulsync/ui/lib/utils';
import { btnPrimaryMd, btnPrimaryOutlineMd } from '@/lib/ui-classes';
import { upsertMarriageRecordChildrenBatch } from '@/lib/marriage-record-api';

function childRowKey(child: MarriageRecordChildDto, index: number): string {
  const mother = child.motherSlotIndex ?? 0;
  return `${mother}:${child.name}:${child.dateOfBirth}:${index}`;
}

/** @deprecated Prefer `flattenRegistryFamilyChildren` from shared-types. */
export function buildFamilyChildrenFromRecords(
  records: MarriageRecordDto[],
  archivedRecords: MarriageRecordArchiveDto[] = [],
): MarriageRecordChildDto[] {
  return flattenRegistryFamilyChildren(records, archivedRecords);
}

export function groupChildrenForBatchSave(
  flatList: MarriageRecordChildDto[],
  records: MarriageRecordDto[],
  maxSlots: number,
): UpsertMarriageRecordChildrenBatchDto['slots'] {
  const grouped = groupChildrenByMotherSlot(flatList, 1);
  const slotIndexes = new Set<number>();
  for (const record of records) {
    if (canUpdateChildrenOnMarriageRecord(record.status)) {
      slotIndexes.add(record.slotIndex);
    }
  }
  for (const slot of grouped.keys()) {
    slotIndexes.add(slot);
  }
  const slots: UpsertMarriageRecordChildrenBatchDto['slots'] = [];
  for (const slotIndex of slotIndexes) {
    if (slotIndex < 1 || slotIndex > maxSlots) {
      continue;
    }
    const record = records.find((r) => r.slotIndex === slotIndex);
    if (record && !canUpdateChildrenOnMarriageRecord(record.status)) {
      continue;
    }
    slots.push({
      slotIndex,
      children: grouped.get(slotIndex) ?? [],
    });
  }
  return slots;
}

export function countChildrenForMotherSlot(
  children: MarriageRecordChildDto[],
  slotIndex: number,
): number {
  return children.filter((c) => (c.motherSlotIndex ?? 1) === slotIndex).length;
}

function listsEqual(a: MarriageRecordChildDto[], b: MarriageRecordChildDto[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((child, i) => {
    const other = b[i];
    if (!other) {
      return false;
    }
    return (
      child.name === other.name &&
      child.gender === other.gender &&
      child.dateOfBirth === other.dateOfBirth &&
      (child.motherSlotIndex ?? 1) === (other.motherSlotIndex ?? 1)
    );
  });
}

type MarriageRegistryFamilyChildrenProps = {
  gender?: Gender | null;
  records: MarriageRecordDto[];
  archivedRecords?: MarriageRecordArchiveDto[];
  maxSlots: number;
  wifeOptions: MarriageChildWifeOption[];
  showMotherSelect: boolean;
  disabled?: boolean;
  /** When false, section hidden unless there are children to show read-only. */
  hasEditableDraftSlot: boolean;
  draftMarriageDatesBySlot?: Record<number, string>;
  onSaved: () => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

export function MarriageRegistryFamilyChildren({
  gender = null,
  records,
  archivedRecords = [],
  maxSlots,
  wifeOptions,
  showMotherSelect,
  disabled,
  hasEditableDraftSlot,
  draftMarriageDatesBySlot,
  onSaved,
  onDirtyChange,
}: MarriageRegistryFamilyChildrenProps) {
  const serverBaseline = React.useMemo(
    () => flattenRegistryFamilyChildren(records, archivedRecords),
    [archivedRecords, records],
  );
  const [children, setChildren] = React.useState<MarriageRecordChildDto[]>(() => serverBaseline);
  const [saving, setSaving] = React.useState(false);
  const [formEditor, setFormEditor] = React.useState<
    { mode: 'add' } | { mode: 'edit'; index: number } | null
  >(null);
  const [formSubmitError, setFormSubmitError] = React.useState<string | null>(null);

  const dirty = !listsEqual(children, serverBaseline);

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const defaultMotherSlot = React.useMemo(() => {
    return wifeOptions[0]?.slotIndex ?? 1;
  }, [wifeOptions]);

  const [formValues, setFormValues] = React.useState<MarriageChildFormValues>(() =>
    emptyChildFormValues(1),
  );

  const openAddForm = () => {
    setFormSubmitError(null);
    setFormValues(emptyChildFormValues(defaultMotherSlot));
    setFormEditor({ mode: 'add' });
  };

  const openEditForm = (index: number) => {
    const child = children[index];
    if (!child) {
      return;
    }
    setFormValues(childToFormValues(child));
    setFormEditor({ mode: 'edit', index });
  };

  const closeForm = () => {
    setFormEditor(null);
  };

  const commitForm = () => {
    const nextChild = formValuesToChild(formValues);
    if (!nextChild.name || !nextChild.dateOfBirth) {
      return;
    }
    const check = validateMarriageRecordChildrenBatch(
      [nextChild],
      records,
      draftMarriageDatesBySlot,
      archivedRecords,
    );
    if (!check.ok) {
      setFormSubmitError(check.message);
      return;
    }
    setFormSubmitError(null);
    if (formEditor?.mode === 'add') {
      setChildren((prev) => [...prev, nextChild]);
    } else if (formEditor?.mode === 'edit') {
      setChildren((prev) => prev.map((row, i) => (i === formEditor.index ? nextChild : row)));
    }
    closeForm();
  };

  const hasAnyChildren = children.length > 0;
  const showMotherInForm = showMotherSelect && wifeOptions.length > 1;
  const visible = hasEditableDraftSlot || (hasAnyChildren && serverBaseline.length > 0);

  if (!visible) {
    return null;
  }

  const save = async () => {
    const batchCheck = validateMarriageRecordChildrenBatch(
      children,
      records,
      draftMarriageDatesBySlot,
      archivedRecords,
    );
    if (!batchCheck.ok) {
      toast.error(batchCheck.message);
      return;
    }
    setSaving(true);
    try {
      const slots = groupChildrenForBatchSave(children, records, maxSlots);
      if (slots.length === 0) {
        toast.error('No draft marriage slot available to save children');
        return;
      }
      await upsertMarriageRecordChildrenBatch({ slots });
      toast.success('Children saved');
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save children');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)]/80 bg-[var(--background)] p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold">Family children (optional)</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          Listed on your biodata when relevant. Save before confirming a marriage if you added or
          changed children.
        </p>
      </div>

      {hasEditableDraftSlot && formEditor ? (
        <MarriageChildFormPanel
          mode={formEditor.mode}
          values={formValues}
          onChange={(next) => {
            setFormValues(next);
            setFormSubmitError(null);
          }}
          wifeOptions={wifeOptions}
          showMotherSelect={showMotherInForm}
          records={records}
          archivedRecords={archivedRecords}
          draftMarriageDatesBySlot={draftMarriageDatesBySlot}
          disabled={disabled || saving}
          submitError={formSubmitError}
          onCancel={closeForm}
          onSubmit={commitForm}
        />
      ) : null}

      {hasEditableDraftSlot && !formEditor ? (
        <button
          type="button"
          disabled={disabled || saving}
          onClick={openAddForm}
          className={cn(
            'group flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-[var(--border)]',
            'bg-[var(--muted)]/20 px-4 py-4 text-left transition-colors',
            'hover:border-[var(--color-brand-700)]/40 hover:bg-[var(--color-brand-50)]/50',
            'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-lg font-light text-white"
            aria-hidden
          >
            +
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-[var(--foreground)]">
              Add a child
            </span>
            <span className="text-muted-foreground mt-0.5 block text-xs">
              Name, gender, and date of birth
            </span>
          </span>
        </button>
      ) : null}

      {hasAnyChildren ? (
        <ul className="space-y-3">
          {children.map((child, index) => {
            if (formEditor?.mode === 'edit' && formEditor.index === index) {
              return null;
            }
            return (
              <MarriageChildRow
                key={childRowKey(child, index)}
                index={index}
                child={child}
                wifeOptions={wifeOptions}
                showMotherSelect={showMotherSelect}
                profileGender={gender}
                registryRecords={records}
                archivedRecords={archivedRecords}
                readOnly={false}
                disabled={disabled || saving || formEditor != null}
                onEdit={() => openEditForm(index)}
                onRemove={() => {
                  setChildren((prev) => prev.filter((_, i) => i !== index));
                  if (formEditor?.mode === 'edit' && formEditor.index === index) {
                    closeForm();
                  }
                }}
              />
            );
          })}
        </ul>
      ) : !hasEditableDraftSlot ? (
        <p className="text-muted-foreground text-sm">No children on file.</p>
      ) : !formEditor ? (
        <p className="text-muted-foreground text-center text-xs">
          Your saved children will appear here after you add them.
        </p>
      ) : null}

      {hasEditableDraftSlot ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={cnFullWidthSm(btnPrimaryOutlineMd)}
            disabled={disabled || saving || !dirty}
            onClick={() => setChildren(serverBaseline)}
          >
            Reset changes
          </button>
          <button
            type="button"
            className={cnFullWidthSm(btnPrimaryMd)}
            disabled={disabled || saving || !dirty}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : 'Save children'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function cnFullWidthSm(className: string): string {
  return `${className} w-full sm:w-auto`;
}
