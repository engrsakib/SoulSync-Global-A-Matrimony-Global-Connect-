'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayFlag, DayPicker, UI, type DayPickerProps } from 'react-day-picker';
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
      className={cn('soulsync-calendar p-3', className)}
      classNames={{
        [UI.Root]: 'relative w-[min(100%,20rem)]',
        [UI.Months]: 'relative flex w-full flex-col',
        [UI.Month]: 'relative flex w-full flex-col gap-2',
        [UI.MonthCaption]: 'relative mb-1 flex h-10 w-full items-center justify-center',
        [UI.CaptionLabel]:
          'inline-flex items-center gap-1 text-sm font-medium text-[var(--foreground)]',
        [UI.Dropdowns]: 'flex flex-wrap items-center justify-center gap-2',
        [UI.DropdownRoot]:
          'relative inline-flex h-9 min-w-[5.5rem] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-white shadow-sm',
        [UI.Dropdown]:
          'absolute inset-0 z-[2] h-full w-full cursor-pointer opacity-0 appearance-none border-0 bg-transparent p-0',
        [UI.Chevron]: 'h-4 w-4 shrink-0 opacity-60',
        [UI.Nav]: 'flex items-center gap-0.5',
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 shrink-0 p-0 opacity-90 hover:opacity-100',
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 w-8 shrink-0 p-0 opacity-90 hover:opacity-100',
        ),
        [UI.MonthGrid]: 'w-full border-collapse',
        [UI.Weekdays]: 'flex',
        [UI.Weekday]: 'w-9 text-center text-[0.75rem] font-normal text-[var(--muted-foreground)]',
        [UI.Week]: 'mt-0.5 flex w-full max-w-full',
        [UI.Day]: 'relative p-0 text-center text-sm',
        [UI.DayButton]: cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] p-0 font-normal',
          'hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          'aria-selected:bg-[var(--primary)] aria-selected:text-[var(--primary-foreground)]',
          'aria-selected:hover:bg-[var(--primary)] aria-selected:hover:text-[var(--primary-foreground)]',
        ),
        [DayFlag.today]: 'font-semibold text-[var(--primary)]',
        [DayFlag.outside]: 'text-[var(--muted-foreground)] opacity-40',
        [DayFlag.disabled]: 'text-[var(--muted-foreground)] opacity-30',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...chevronProps }) => {
          const Icon =
            orientation === 'down'
              ? ChevronDown
              : orientation === 'left'
                ? ChevronLeft
                : ChevronRight;
          return <Icon className={cn('h-4 w-4', chevronClass)} {...chevronProps} />;
        },
      }}
      {...props}
    />
  );
}
