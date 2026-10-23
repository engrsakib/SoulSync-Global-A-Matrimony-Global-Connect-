'use client';

import type {
  MarriageRecordChildDto,
  MarriageRecordDto,
} from '@soulsync/shared-types/marriage-record';
import {
  childDateOfBirthBounds,
  resolveMotherMarriageContext,
  validateChildDateOfBirth,
} from '@soulsync/shared-types/marriage-record';
import { cn } from '@soulsync/ui/lib/utils';
import { Label } from '@soulsync/ui/label';
import { dateToIso, IsoDatePicker } from '@soulsync/ui/iso-date-picker';
import { btnPrimaryMd, btnPrimaryOutlineMd } from '@/lib/ui-classes';
import {
  marriageChildInputClass,
  type MarriageChildWifeOption,
} from '@/components/dashboard/marriage-child-row';
import {
  formatMotherWifeOptionLabel,
  motherSlotStatusLabel,
} from '@/components/dashboard/marriage-child-row';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';

export type MarriageChildFormValues = {
  name: string;
  gender: MarriageRecordChildDto['gender'];
  dateOfBirth: string;
  motherSlotIndex: number;
};

export function emptyChildFormValues(defaultMotherSlot: number): MarriageChildFormValues {
  return {
    name: '',
    gender: 'MALE',
    dateOfBirth: '',
    motherSlotIndex: defaultMotherSlot,
  };
}

export function childToFormValues(child: MarriageRecordChildDto): MarriageChildFormValues {
  return {
    name: child.name,
    gender: child.gender,
    dateOfBirth: child.dateOfBirth,
    motherSlotIndex: child.motherSlotIndex ?? 1,
  };
}

export function formValuesToChild(values: MarriageChildFormValues): MarriageRecordChildDto {
  return {
    name: values.name.trim(),
    gender: values.gender,
    dateOfBirth: values.dateOfBirth,
    motherSlotIndex: values.motherSlotIndex,
  };
}

export function isChildFormValid(
  values: MarriageChildFormValues,
  records: MarriageRecordDto[],
  draftMarriageDatesBySlot?: Record<number, string>,
): boolean {
  if (!values.name.trim() || !values.dateOfBirth.trim()) {
    return false;
  }
  return validateChildDateOfBirth(formValuesToChild(values), records, draftMarriageDatesBySlot).ok;
}

type MarriageChildFormPanelProps = {
  mode: 'add' | 'edit';
  values: MarriageChildFormValues;
  onChange: (values: MarriageChildFormValues) => void;
  wifeOptions: MarriageChildWifeOption[];
  showMotherSelect: boolean;
  records: MarriageRecordDto[];
  draftMarriageDatesBySlot?: Record<number, string>;
  disabled?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitError?: string | null;
};

export function MarriageChildFormPanel({
  mode,
  values,
  onChange,
  wifeOptions,
  showMotherSelect,
  records,
  draftMarriageDatesBySlot,
  disabled,
  onCancel,
  onSubmit,
  submitError,
}: MarriageChildFormPanelProps) {
  const canSubmit = isChildFormValid(values, records, draftMarriageDatesBySlot);
  const formId = mode === 'add' ? 'add-child-form' : 'edit-child-form';
  const motherContext = resolveMotherMarriageContext(
    values.motherSlotIndex,
    records,
    draftMarriageDatesBySlot,
  );
  const dobBounds = childDateOfBirthBounds(motherContext);
  const dobHelper = dobBounds.ok
    ? `Allowed from ${dobBounds.minIso} through ${dobBounds.maxIso} (at least 210 days after marriage).`
    : dobBounds.message;
  return (
    <div
      className="animate-in fade-in slide-in-from-top-1 space-y-4 rounded-xl border border-[var(--color-brand-700)]/20 bg-[var(--color-brand-50)]/40 p-4 shadow-sm duration-200 dark:bg-[var(--muted)]/30"
      role="region"
      aria-labelledby={`${formId}-title`}
    >
      <div>
        <h4 id={`${formId}-title`} className="text-sm font-semibold text-[var(--foreground)]">
          {mode === 'add' ? 'Add a child' : 'Edit child'}
        </h4>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Enter the details below, then save to your list. Use &quot;Save children&quot; at the
          bottom to store on your biodata.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {showMotherSelect ? (
          <div className="sm:col-span-2">
            <SelectWithChevron
              id={`${formId}-mother`}
              label="Mother (wife)"
              className="bg-white"
              value={String(values.motherSlotIndex)}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...values,
                  motherSlotIndex: Number.parseInt(e.target.value, 10),
                })
              }
            >
              {wifeOptions.map((wife) => {
                const record = records.find((r) => r.slotIndex === wife.slotIndex);
                return (
                  <option key={wife.slotIndex} value={String(wife.slotIndex)}>
                    {formatMotherWifeOptionLabel(wife, {
                      statusLabel: motherSlotStatusLabel(record?.status),
                    })}
                  </option>
                );
              })}
            </SelectWithChevron>
            <p className="text-muted-foreground mt-1.5 text-xs">
              Choose which wife is the mother. Date of birth must fall between her marriage date
              (plus 210 days) and today, or her divorce or passing date if the marriage has ended.
            </p>
          </div>
        ) : null}
        <div>
          <Label htmlFor={`${formId}-name`}>Child name</Label>
          <input
            id={`${formId}-name`}
            className={cn(marriageChildInputClass, 'mt-1.5 bg-white')}
            placeholder="Full name"
            value={values.name}
            disabled={disabled}
            autoFocus
            onChange={(e) => onChange({ ...values, name: e.target.value })}
          />
        </div>
        <div>
          <SelectWithChevron
            id={`${formId}-gender`}
            label="Gender"
            className="bg-white"
            value={values.gender}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...values,
                gender: e.target.value as MarriageRecordChildDto['gender'],
              })
            }
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </SelectWithChevron>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${formId}-dob`}>Date of birth</Label>
          <div className="mt-1.5">
            <IsoDatePicker
              id={`${formId}-dob`}
              value={values.dateOfBirth}
              onChange={(v) => onChange({ ...values, dateOfBirth: v })}
              minIso={dobBounds.ok ? dobBounds.minIso : undefined}
              maxIso={dobBounds.ok ? dobBounds.maxIso : dateToIso(new Date())}
              placeholder="Select date of birth"
            />
          </div>
          <p
            className={
              dobBounds.ok
                ? 'text-muted-foreground mt-1.5 text-xs'
                : 'mt-1.5 text-xs text-amber-800 dark:text-amber-200'
            }
          >
            {dobHelper}
          </p>
        </div>
      </div>

      {submitError ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className={cn(btnPrimaryOutlineMd, 'w-full bg-white sm:w-auto')}
          disabled={disabled}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className={cn(btnPrimaryMd, 'w-full sm:w-auto')}
          disabled={disabled || !canSubmit}
          onClick={onSubmit}
        >
          {mode === 'add' ? 'Add to list' : 'Update in list'}
        </button>
      </div>
    </div>
  );
}
