import { UserActivityType } from '@soulsync/db';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { ActivityLogListSort } from '../activity-log.types';

const SORT_VALUES = ['newest', 'oldest'] as const;

function toStringArray(value: unknown): string[] | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => (typeof item === 'string' ? item.split(',') : []))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export class ListActivityLogQueryDto {
  @IsOptional()
  @Transform(({ value }) => toStringArray(value))
  @IsArray()
  @IsEnum(UserActivityType, { each: true })
  types?: UserActivityType[];

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(SORT_VALUES)
  sort?: ActivityLogListSort;

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
