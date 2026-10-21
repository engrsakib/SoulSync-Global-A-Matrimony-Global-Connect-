'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import {
  buildPhoneCountryOptions,
  formatPhoneE164,
  getPhoneHelperText,
  getPhoneNationalMaxLength,
  parseStoredPhone,
  type CountryCode,
  type PhoneCountryOption,
} from '@soulsync/shared-types/phone';

const countryOptions = buildPhoneCountryOptions();

function findOption(country: CountryCode): PhoneCountryOption {
  return countryOptions.find((o) => o.country === country) ?? countryOptions[0]!;
}

function initialPhoneState(valueE164: string, defaultCountry: CountryCode) {
  const parsed = parseStoredPhone(valueE164, defaultCountry);
  if (parsed) {
    return { country: parsed.country, national: parsed.nationalNumber };
  }
  return { country: defaultCountry, national: '' };
}

export function InternationalPhoneField({
  id,
  label,
  valueE164,
  defaultCountry = 'BD',
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  valueE164: string;
  defaultCountry?: CountryCode;
  onChange: (e164: string) => void;
  disabled?: boolean;
}) {
  const [country, setCountry] = React.useState<CountryCode>(
    () => initialPhoneState(valueE164, defaultCountry).country,
  );
  const [national, setNational] = React.useState(
    () => initialPhoneState(valueE164, defaultCountry).national,
  );
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const listId = `${id}-country-list`;
  const rootRef = React.useRef<HTMLDivElement>(null);

  const emitChange = React.useCallback(
    (nextCountry: CountryCode, nextNational: string) => {
      const e164 = formatPhoneE164(nextCountry, nextNational);
      onChange(e164 ?? '');
    },
    [onChange],
  );

  const handleNationalChange = (raw: string) => {
    const digits = raw.replace(/\D/gu, '');
    setNational(digits);
    emitChange(country, digits);
  };

  const selectCountry = (option: PhoneCountryOption) => {
    setCountry(option.country);
    setPickerOpen(false);
    setQuery('');
    emitChange(option.country, national);
  };

  React.useEffect(() => {
    if (!pickerOpen) {
      return;
    }
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pickerOpen]);

  const selected = findOption(country);
  const maxLen = getPhoneNationalMaxLength(country);
  const helper = getPhoneHelperText(country);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return countryOptions.slice(0, 80);
    }
    return countryOptions
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.callingCode.includes(q) ||
          o.country.toLowerCase().includes(q),
      )
      .slice(0, 80);
  }, [query]);

  return (
    <div ref={rootRef}>
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          'mt-1.5 flex h-11 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-white',
          'focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:outline-none',
          disabled && 'opacity-70',
        )}
      >
        <div className="relative shrink-0 border-r border-[var(--border)]">
          <button
            type="button"
            id={`${id}-country`}
            className="flex h-full min-w-[6.75rem] items-center gap-1.5 px-2 text-sm disabled:cursor-not-allowed"
            disabled={disabled}
            aria-expanded={pickerOpen}
            aria-controls={listId}
            onClick={() => setPickerOpen((o) => !o)}
          >
            <span className="text-base leading-none" aria-hidden>
              {selected.flag}
            </span>
            <span className="font-medium tabular-nums">{selected.callingCode}</span>
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
          </button>
          {pickerOpen ? (
            <div className="absolute top-full left-0 z-30 mt-1 w-64 rounded-[var(--radius)] border border-[var(--border)] bg-white shadow-lg">
              <input
                className="w-full border-b border-[var(--border)] px-3 py-2 text-sm outline-none"
                placeholder="Search country or code"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
              />
              <ul id={listId} className="max-h-52 overflow-y-auto py-1" role="listbox">
                {filtered.map((option) => (
                  <li key={option.country}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={option.country === country}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--muted)]/40',
                        option.country === country && 'bg-[var(--muted)]/30',
                      )}
                      onClick={() => selectCountry(option)}
                    >
                      <span aria-hidden>{option.flag}</span>
                      <span className="flex-1 truncate">{option.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {option.callingCode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed"
          value={national}
          maxLength={maxLen}
          disabled={disabled}
          placeholder="Mobile number"
          onChange={(e) => handleNationalChange(e.target.value)}
        />
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{helper}</p>
    </div>
  );
}
