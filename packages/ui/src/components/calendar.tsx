'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayFlag, DayPicker, UI, type DayPickerProps } from 'react-day-picker';
import { cn } from '../lib/utils';
import { buttonVariants } from './button';

import 'react-day-picker/style.css';

export type CalendarProps = DayPickerProps;

function isFridayWeekdayLabel(label: React.ReactNode): boolean {
  if (typeof label === 'string') {
    const normalized = label.trim().toLowerCase();
    return normalized === 'fr' || normalized === 'fri' || normalized.startsWith('friday');
  }
  return false;
}

function FridayWeekday({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={cn(className, isFridayWeekdayLabel(children) && 'font-medium text-red-600')}
    >
      {children}
    </th>
  );
}

const defaultFridayModifier = (date: Date) => date.getDay() === 5;

/** Custom classNames replace rdp defaults — always keep the matching `rdp-*` hook class. */
const navBtnOutline = cn(
  buttonVariants({ variant: 'outline' }),
  'h-8 w-8 shrink-0 p-0 opacity-90 hover:opacity-100',
);

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  weekStartsOn = 1,
  modifiers,
  modifiersClassNames,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      weekStartsOn={weekStartsOn}
      modifiers={{
        friday: defaultFridayModifier,
        ...modifiers,
      }}
      modifiersClassNames={{
        friday: 'rdp-friday',
        ...modifiersClassNames,
      }}
      className={cn('soulsync-calendar p-3', className)}
      classNames={{
        [UI.Root]: cn('rdp-root', 'relative w-[min(100%,20rem)]'),
        [UI.Months]: cn('rdp-months', 'relative flex w-full flex-col'),
        [UI.Month]: cn('rdp-month', 'relative w-full min-h-[var(--rdp-nav-height)]'),
        [UI.MonthCaption]: cn(
          'rdp-month_caption',
          'relative z-[1] mb-1 flex h-10 w-full min-h-[var(--rdp-nav-height)] items-center justify-center',
        ),
        [UI.CaptionLabel]: cn(
          'rdp-caption_label',
          'inline-flex items-center gap-1 text-sm font-medium text-[var(--foreground)]',
        ),
        [UI.Dropdowns]: cn(
          'rdp-dropdowns',
          'inline-flex flex-wrap items-center justify-center gap-2',
        ),
        [UI.DropdownRoot]: cn(
          'rdp-dropdown_root',
          'relative inline-flex h-9 min-w-[5.5rem] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-white shadow-sm',
        ),
        [UI.Dropdown]: cn(
          'rdp-dropdown',
          'absolute inset-0 z-[2] h-full w-full cursor-pointer opacity-0 appearance-none border-0 bg-transparent p-0',
        ),
        [UI.Chevron]: cn('rdp-chevron', 'h-4 w-4 shrink-0 opacity-60'),
        [UI.Nav]: cn('rdp-nav', 'flex items-center gap-0.5'),
        [UI.PreviousMonthButton]: cn('rdp-button_previous', navBtnOutline),
        [UI.NextMonthButton]: cn('rdp-button_next', navBtnOutline),
        [UI.MonthGrid]: cn('rdp-month_grid', 'w-full border-collapse'),
        [UI.Weekdays]: cn('rdp-weekdays', 'flex'),
        [UI.Weekday]: cn(
          'rdp-weekday',
          'w-9 text-center text-[0.75rem] font-normal text-[var(--muted-foreground)]',
        ),
        [UI.Week]: cn('rdp-week', 'mt-0.5 flex w-full max-w-full'),
        [UI.Day]: cn('rdp-day', 'relative p-0 text-center text-sm'),
        [UI.DayButton]: cn(
          'rdp-day_button',
          'inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] p-0 font-normal',
          'hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
          'aria-selected:bg-[var(--primary)] aria-selected:text-[var(--primary-foreground)]',
          'aria-selected:hover:bg-[var(--primary)] aria-selected:hover:text-[var(--primary-foreground)]',
        ),
        [DayFlag.today]: cn('rdp-today', 'font-semibold text-[var(--primary)]'),
        [DayFlag.outside]: cn('rdp-outside', 'text-[var(--muted-foreground)] opacity-40'),
        [DayFlag.disabled]: cn('rdp-disabled', 'text-[var(--muted-foreground)] opacity-30'),
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
        Weekday: FridayWeekday,
        ...components,
      }}
      {...props}
    />
  );
}
