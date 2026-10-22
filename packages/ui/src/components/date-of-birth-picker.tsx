'use client';

import * as React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import {
  BIODATA_MAX_AGE,
  BIODATA_MIN_AGE,
  getBiodataDateOfBirthIsoBounds,
} from '@soulsync/shared-types';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type DateOfBirthPickerProps = {
  id?: string;
  value: string;
  onChange: (isoDate: string) => void;
  minAge?: number;
  maxAge?: number;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

function isoToDate(iso: string): Date | undefined {
  if (!iso || iso.length < 10) {
    return undefined;
  }
  const d = parseISO(iso.slice(0, 10));
  return isValid(d) ? d : undefined;
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function DateOfBirthPicker({
  id,
  value,
  onChange,
  minAge = BIODATA_MIN_AGE,
  maxAge = BIODATA_MAX_AGE,
  disabled,
  className,
  ...aria
}: DateOfBirthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const bounds = React.useMemo(
    () => getBiodataDateOfBirthIsoBounds(new Date(), minAge, maxAge),
    [minAge, maxAge],
  );
  const minDate = React.useMemo(() => isoToDate(bounds.minIso)!, [bounds.minIso]);
  const maxDate = React.useMemo(() => isoToDate(bounds.maxIso)!, [bounds.maxIso]);
  const selected = isoToDate(value);
  const defaultMonth = selected ?? maxDate;

  const label = selected ? format(selected, 'PPP') : 'Select date of birth';

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
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={defaultMonth}
          startMonth={minDate}
          endMonth={maxDate}
          captionLayout="dropdown"
          navLayout="after"
          disabled={{ before: minDate, after: maxDate }}
          onSelect={(day) => {
            if (!day) {
              return;
            }
            onChange(dateToIso(day));
            setOpen(false);
          }}
        />
        <p className="border-t border-[var(--border)] px-3 py-2 text-xs text-[var(--muted-foreground)]">
          Ages {minAge}–{maxAge} only
        </p>
      </PopoverContent>
    </Popover>
  );
}
