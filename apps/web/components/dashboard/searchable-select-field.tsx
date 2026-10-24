'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  filterSearchableSelectOptions,
  SEARCHABLE_SELECT_LARGE_LIST_THRESHOLD,
} from '@soulsync/shared-types/searchable-select';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { formControlClass, formPopoverPanelClass } from '@/lib/ui-classes';

export type SearchableSelectOption = {
  value: string;
  label: string;
  data?: string;
};

export const inputWithChevronClass = cn(
  formControlClass,
  'py-2 pl-3 pr-10',
  'disabled:cursor-not-allowed disabled:bg-[var(--muted)]/20 disabled:opacity-70',
);

const listClass = cn(formPopoverPanelClass, 'max-h-72 overflow-y-auto py-1');

type SearchableSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: SearchableSelectOption[];
  onSelect: (option: SearchableSelectOption) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  emptyMessage?: string;
};

export function SearchableSelectField({
  id,
  label,
  value,
  options,
  onSelect,
  disabled = false,
  loading = false,
  placeholder = 'Select…',
  emptyMessage = 'No matches.',
}: SearchableSelectFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [highlightKey, setHighlightKey] = React.useState('');

  const selectedLabel = React.useMemo(
    () => options.find((o) => o.value === value || o.label === value)?.label ?? value,
    [options, value],
  );

  const inputValue = open ? query : selectedLabel;

  const filtered = React.useMemo(
    () => filterSearchableSelectOptions(options, query),
    [options, query],
  );

  const showLargeListHint =
    !query.trim() && options.length > SEARCHABLE_SELECT_LARGE_LIST_THRESHOLD;

  const highlightIndex = React.useMemo(() => {
    if (!highlightKey || filtered.length === 0) {
      return 0;
    }
    const idx = filtered.findIndex((o) => `${o.value}-${o.label}` === highlightKey);
    return idx >= 0 ? idx : 0;
  }, [filtered, highlightKey]);

  const showList = open && !disabled;

  const pickOption = (option: SearchableSelectOption) => {
    onSelect(option);
    setOpen(false);
    setQuery('');
  };

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative h-11">
        <input
          id={id}
          className={inputWithChevronClass}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightKey('');
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              setQuery(selectedLabel || '');
              setHighlightKey('');
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
              return;
            }
            if (!showList || filtered.length === 0) {
              return;
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              const next = Math.min(highlightIndex + 1, filtered.length - 1);
              const option = filtered[next];
              if (option) {
                setHighlightKey(`${option.value}-${option.label}`);
              }
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              const next = Math.max(highlightIndex - 1, 0);
              const option = filtered[next];
              if (option) {
                setHighlightKey(`${option.value}-${option.label}`);
              }
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              const option = filtered[highlightIndex];
              if (option) {
                pickOption(option);
              }
            }
          }}
        />
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-[var(--muted-foreground)]"
          aria-hidden
        />
        {showList ? (
          <div className="absolute z-20 mt-1 w-full">
            {showLargeListHint ? (
              <p className="mb-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--muted)]/40 px-2 py-1 text-xs text-[var(--muted-foreground)]">
                Type to search — {options.length} options
              </p>
            ) : null}
            <ul id={`${id}-listbox`} role="listbox" className={listClass}>
              {loading && filtered.length === 0 ? (
                <li className="text-muted-foreground px-3 py-2 text-sm">Loading…</li>
              ) : null}
              {filtered.map((option, index) => (
                <li key={`${option.value}-${option.label}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === option.value || value === option.label}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]',
                      (value === option.value || value === option.label) &&
                        'bg-[var(--muted)]/60 font-medium',
                      highlightIndex === index && 'bg-[var(--muted)]/80',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickOption(option);
                    }}
                    onMouseEnter={() => setHighlightKey(`${option.value}-${option.label}`)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
              {!loading && query.trim() && filtered.length === 0 ? (
                <li className="text-muted-foreground px-3 py-2 text-sm">{emptyMessage}</li>
              ) : null}
            </ul>
            {filtered.length > 0 ? (
              <p className="mt-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-center text-xs text-[var(--muted-foreground)]">
                Showing {filtered.length} of {options.length}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const selectChevronClass = cn(inputWithChevronClass, 'cursor-pointer appearance-none');

export function SelectWithChevron({
  id,
  label,
  children,
  className,
  ...props
}: React.ComponentProps<'select'> & { label: string }) {
  return (
    <div>
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      <div className="relative h-11">
        <select id={id} className={cn(selectChevronClass, className)} {...props}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-[var(--muted-foreground)]"
          aria-hidden
        />
      </div>
    </div>
  );
}

export function InputWithChevron({
  id,
  label,
  className,
  ...props
}: React.ComponentProps<'input'> & { label: string }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input id={id} className={cn(inputWithChevronClass, className)} {...props} />
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          aria-hidden
        />
      </div>
    </div>
  );
}
