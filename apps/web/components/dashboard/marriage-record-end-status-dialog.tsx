'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@soulsync/ui/alert-dialog';
import { Label } from '@soulsync/ui/label';
import { dateToIso, IsoDatePicker } from '@soulsync/ui/iso-date-picker';
import { btnPrimaryMd } from '@/lib/ui-classes';

type MarriageRecordEndStatusDialogProps = {
  open: boolean;
  mode: 'divorced' | 'deceased';
  spouseLabel: string;
  marriageDate: string | null;
  onConfirm: (statusEndedDate: string) => void;
  onOpenChange: (open: boolean) => void;
};

export function MarriageRecordEndStatusDialog({
  open,
  mode,
  spouseLabel,
  marriageDate,
  onConfirm,
  onOpenChange,
}: MarriageRecordEndStatusDialogProps) {
  const maxIso = dateToIso(new Date());
  const minIso = marriageDate?.trim() || undefined;
  const [date, setDate] = React.useState(maxIso);

  const title = mode === 'divorced' ? 'Record divorce' : 'Record passing';
  const dateLabel = mode === 'divorced' ? 'Date of divorce' : 'Date of passing';
  const description =
    mode === 'divorced'
      ? `This updates your marriage with ${spouseLabel} on your registry. History is kept on your profile.`
      : `Record the date with care. Your marriage with ${spouseLabel} remains in history on your profile.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label htmlFor="marriage-end-date">{dateLabel}</Label>
          <div className="mt-2">
            <IsoDatePicker
              id="marriage-end-date"
              value={date}
              onChange={setDate}
              minIso={minIso}
              maxIso={maxIso}
              placeholder="Select date"
            />
          </div>
          {marriageDate ? (
            <p className="text-muted-foreground mt-2 text-xs">
              Marriage date: {marriageDate}. End date must be on or after this day.
            </p>
          ) : null}
        </div>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
          <button
            type="button"
            className={`${btnPrimaryMd} w-full sm:w-auto`}
            disabled={!date.trim()}
            onClick={() => onConfirm(date.trim())}
          >
            Save
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
