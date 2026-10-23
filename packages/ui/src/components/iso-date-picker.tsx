'use client';

import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export function isoToDate(iso: string): Date | undefined {
  if (!iso || iso.length < 10) {
    return undefined;
  }
  const d = parseISO(iso.slice(0, 10));
  return isValid(d) ? d : undefined;
}

export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export type IsoDatePickerProps = {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  minIso?: string;
  maxIso?: string;
  placeholder?: string;
  footer?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

export function IsoDatePicker({
  id,
  value,
  onChange,
  minIso,
  maxIso,
  placeholder = 'Select date',
  footer,
  disabled,
  className,
  ...aria
}: IsoDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const minDate = React.useMemo(() => (minIso ? isoToDate(minIso) : undefined), [minIso]);
  const maxDate = React.useMemo(() => (maxIso ? isoToDate(maxIso) : undefined), [maxIso]);
  const selected = isoToDate(value);
  const defaultMonth = selected ?? maxDate ?? minDate ?? new Date();

  const label = selected ? format(selected, 'PPP') : placeholder;

  const disabledMatcher = React.useMemo(() => {
    if (minDate && maxDate) {
      return { before: minDate, after: maxDate };
    }
    if (minDate) {
      return { before: minDate };
    }
    if (maxDate) {
      return { after: maxDate };
    }
    return undefined;
  }, [minDate, maxDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          disabled={disabled}
          aria-invalid={aria['aria-invalid']}
          aria-describedby={aria['aria-describedby']}
          className={cn(
            'h-11 w-full justify-start gap-2 border-[var(--border)] bg-white px-3 text-sm font-normal',
            !selected && 'text-[var(--muted-foreground)]',
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[18rem] p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={defaultMonth}
          startMonth={minDate}
          endMonth={maxDate}
          captionLayout="dropdown"
          navLayout="around"
          disabled={disabledMatcher}
          onSelect={(day) => {
            if (!day) {
              return;
            }
            onChange(dateToIso(day));
            setOpen(false);
          }}
        />
        {footer ? (
          <div className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
            {footer}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
