'use client';

import * as React from 'react';
import {
  BIODATA_MAX_AGE,
  BIODATA_MIN_AGE,
  getBiodataDateOfBirthIsoBounds,
} from '@soulsync/shared-types';
import { IsoDatePicker, type IsoDatePickerProps } from './iso-date-picker';

export type DateOfBirthPickerProps = Omit<
  IsoDatePickerProps,
  'minIso' | 'maxIso' | 'placeholder' | 'footer'
> & {
  minAge?: number;
  maxAge?: number;
};

export function DateOfBirthPicker({
  minAge = BIODATA_MIN_AGE,
  maxAge = BIODATA_MAX_AGE,
  ...props
}: DateOfBirthPickerProps) {
  const bounds = React.useMemo(
    () => getBiodataDateOfBirthIsoBounds(new Date(), minAge, maxAge),
    [minAge, maxAge],
  );

  return (
    <IsoDatePicker
      {...props}
      minIso={bounds.minIso}
      maxIso={bounds.maxIso}
      placeholder="Select date of birth"
      footer={`Ages ${minAge}–${maxAge} only`}
    />
  );
}
