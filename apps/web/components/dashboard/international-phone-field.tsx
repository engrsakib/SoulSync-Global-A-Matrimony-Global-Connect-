'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import {
  buildPhoneCountryOptions,
  clampPhoneNationalDigits,
  formatPhoneE164,
  getPhoneHelperText,
  getPhoneNationalMaxLength,
  parseStoredPhone,
  type CountryCode,
  type PhoneCountryOption,
} from '@soulsync/shared-types/phone';
import { CountryFlagIcon } from '@/components/dashboard/country-flag-icon';
import { formControlClass, formPopoverPanelClass } from '@/lib/ui-classes';

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

  const selected = findOption(country);
  const maxLen = getPhoneNationalMaxLength(country);
  const helper = getPhoneHelperText(country);

  const emitChange = React.useCallback(
    (nextCountry: CountryCode, nextNational: string) => {
      const e164 = formatPhoneE164(nextCountry, nextNational);
      onChange(e164 ?? '');
    },
    [onChange],
  );

  const handleNationalChange = (raw: string) => {
    const digits = clampPhoneNationalDigits(country, raw);
    setNational(digits);
    emitChange(country, digits);
  };

  const selectCountry = (option: PhoneCountryOption) => {
    const digits = clampPhoneNationalDigits(option.country, national);
    setCountry(option.country);
    setNational(digits);
    setPickerOpen(false);
    setQuery('');
    emitChange(option.country, digits);
  };

  const blockExtraNationalDigits = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (event.key.length !== 1 || !/\d/u.test(event.key)) {
      return;
    }
    const input = event.currentTarget;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    const replacing = end > start;
    if (!replacing && national.length >= maxLen) {
      event.preventDefault();
    }
  };

  const handleNationalPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!text) {
      return;
    }
    event.preventDefault();
    const input = event.currentTarget;
    const start = input.selectionStart ?? national.length;
    const end = input.selectionEnd ?? national.length;
    handleNationalChange(national.slice(0, start) + text + national.slice(end));
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

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return countryOptions;
    }
    return countryOptions.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.callingCode.includes(q) ||
        o.country.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div ref={rootRef}>
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          'mt-1.5 flex h-11 overflow-visible rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]',
          'focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:outline-none',
          disabled && 'opacity-70',
        )}
      >
        <div className="relative shrink-0 rounded-l-[var(--radius)] border-r border-[var(--border)] bg-[var(--muted)]/30">
          <button
            type="button"
            id={`${id}-country`}
            className="flex h-full min-w-[10rem] items-center gap-2 px-2.5 text-sm disabled:cursor-not-allowed"
            disabled={disabled}
            aria-expanded={pickerOpen}
            aria-controls={listId}
            aria-label={`${selected.name}, ${selected.callingCode}`}
            onClick={() => setPickerOpen((o) => !o)}
          >
            <CountryFlagIcon iso2={selected.country} emojiFallback={selected.flag} />
            <span className="text-xs font-medium text-[var(--foreground)]">{selected.country}</span>
            <span className="h-4 w-px shrink-0 bg-[var(--border)]" aria-hidden />
            <span className="font-semibold tabular-nums">{selected.callingCode}</span>
            <ChevronDown
              className={cn(
                'ml-auto h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform',
                pickerOpen && 'rotate-180',
              )}
            />
          </button>
          {pickerOpen ? (
            <div className={cn(formPopoverPanelClass, 'absolute top-full left-0 z-50 mt-1 w-80 shadow-lg')}>
              <input
                className={cn(
                  formControlClass,
                  'h-auto rounded-none border-0 border-b border-[var(--border)] shadow-none focus-visible:ring-0',
                )}
                placeholder="Search country or code"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
              />
              <ul id={listId} className="max-h-64 overflow-y-auto py-1" role="listbox">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-[var(--muted-foreground)]">No matches</li>
                ) : null}
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
                      <CountryFlagIcon iso2={option.country} emojiFallback={option.flag} />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{option.name}</span>
                        <span className="ml-1.5 text-xs text-[var(--muted-foreground)]">
                          {option.country}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-[var(--muted-foreground)]">
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
          className="min-w-0 flex-1 rounded-r-[var(--radius)] bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed"
          value={national}
          maxLength={maxLen}
          disabled={disabled}
          placeholder="Mobile number"
          onKeyDown={blockExtraNationalDigits}
          onPaste={handleNationalPaste}
          onChange={(e) => handleNationalChange(e.target.value)}
        />
      </div>
      <p className="text-muted-foreground mt-1 text-xs">{helper}</p>
    </div>
  );
}
