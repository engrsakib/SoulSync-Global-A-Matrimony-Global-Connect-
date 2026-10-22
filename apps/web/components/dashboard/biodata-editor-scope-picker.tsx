'use client';

import type { BiodataEditorScope } from '@soulsync/shared-types/biodata-editor-grant';
import { cn } from '@soulsync/ui/lib/utils';

const OPTIONS: { value: BiodataEditorScope; title: string; description: string }[] = [
  {
    value: 'CONTENT',
    title: 'Biodata content',
    description: 'Sections, photos, and profile details',
  },
  {
    value: 'SETTINGS',
    title: 'Settings & approvals',
    description: 'Listing, privacy, and view-access requests',
  },
  {
    value: 'BOTH',
    title: 'Both',
    description: 'Full helper access (recommended)',
  },
];

type BiodataEditorScopePickerProps = {
  value: BiodataEditorScope;
  onChange: (scope: BiodataEditorScope) => void;
  name?: string;
  disabled?: boolean;
};

export function BiodataEditorScopePicker({
  value,
  onChange,
  name = 'editor-scope',
  disabled,
}: BiodataEditorScopePickerProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="sr-only">Edit access scope</legend>
      {OPTIONS.map((option) => {
        const id = `${name}-${option.value}`;
        const checked = value === option.value;
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={cn(
              'flex cursor-pointer gap-3 rounded-xl border px-3 py-2.5 transition-colors',
              checked
                ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-50)]/60'
                : 'border-[var(--border)]/70 bg-[var(--background)] hover:border-[var(--border)]',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              className="mt-1"
              checked={checked}
              onChange={() => onChange(option.value)}
            />
            <span>
              <span className="block text-sm font-medium text-[var(--foreground)]">
                {option.title}
              </span>
              <span className="text-muted-foreground block text-xs">{option.description}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
