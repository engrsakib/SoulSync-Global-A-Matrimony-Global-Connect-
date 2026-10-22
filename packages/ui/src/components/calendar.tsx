'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayFlag, DayPicker, SelectionState, UI, type DayPickerProps } from 'react-day-picker';
import { cn } from '../lib/utils';
import { buttonVariants } from './button';

import 'react-day-picker/style.css';

export type CalendarProps = DayPickerProps;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('soulsync-calendar p-2', className)}
      classNames={{
        [UI.Root]: 'relative',
        [UI.Months]: 'flex flex-col gap-4',
        [UI.Month]: 'flex flex-col gap-3',
        [UI.MonthCaption]: 'flex items-center justify-center gap-1 pt-1',
        [UI.CaptionLabel]: 'text-sm font-medium text-[var(--foreground)]',
        [UI.Dropdowns]: 'flex items-center gap-2',
        [UI.DropdownRoot]: 'relative inline-flex items-center',
        [UI.Dropdown]:
          'h-8 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-2 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
        [UI.Nav]: 'flex items-center gap-1',
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute left-1 top-0 h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100',
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'absolute right-1 top-0 h-8 w-8 bg-transparent p-0 opacity-80 hover:opacity-100',
        ),
        [UI.MonthGrid]: 'w-full border-collapse',
        [UI.Weekdays]: 'flex',
        [UI.Weekday]:
          'text-muted-foreground w-9 rounded-md text-[0.75rem] font-normal text-[var(--muted-foreground)]',
        [UI.Week]: 'mt-1 flex w-full',
        [UI.Day]:
          'relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20',
        [UI.DayButton]: cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] p-0 font-normal',
          'hover:bg-[var(--muted)] aria-selected:opacity-100',
        ),
        [DayFlag.today]: 'font-semibold text-[var(--primary)]',
        [DayFlag.outside]: 'text-[var(--muted-foreground)] opacity-50',
        [DayFlag.disabled]: 'text-[var(--muted-foreground)] opacity-40',
        [SelectionState.selected]:
          'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] focus:bg-[var(--primary)] focus:text-[var(--primary-foreground)]',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className={cn('h-4 w-4', chevronClass)} {...chevronProps} />;
        },
      }}
      {...props}
    />
  );
}
