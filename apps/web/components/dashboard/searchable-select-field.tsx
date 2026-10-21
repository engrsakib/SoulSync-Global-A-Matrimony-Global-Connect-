'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';

export type SearchableSelectOption = {
  value: string;
  label: string;
  data?: string;
};

export const inputWithChevronClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white py-2 pl-3 pr-10 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
  'disabled:cursor-not-allowed disabled:bg-[var(--muted)]/20 disabled:opacity-70',
);

const listClass = cn(
  'absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius)]',
  'border border-[var(--border)] bg-white py-1 shadow-md',
);

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

  const selectedLabel = React.useMemo(
    () => options.find((o) => o.value === value || o.label === value)?.label ?? value,
    [options, value],
  );

  const inputValue = open ? query : selectedLabel;

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    return list.slice(0, 80);
  }, [options, query]);

  const showList = open && !disabled;

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
            setOpen(true);
          }}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              setQuery(selectedLabel || '');
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
        />
        <ChevronDown
          className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-[var(--muted-foreground)]"
          aria-hidden
        />
        {showList ? (
          <ul id={`${id}-listbox`} role="listbox" className={listClass}>
            {loading && filtered.length === 0 ? (
              <li className="text-muted-foreground px-3 py-2 text-sm">Loading…</li>
            ) : null}
            {filtered.map((option) => (
              <li key={`${option.value}-${option.label}`}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.value || value === option.label}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]',
                    (value === option.value || value === option.label) &&
                      'bg-[var(--muted)]/60 font-medium',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
            {!loading && query.trim() && filtered.length === 0 ? (
              <li className="text-muted-foreground px-3 py-2 text-sm">{emptyMessage}</li>
            ) : null}
          </ul>
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
