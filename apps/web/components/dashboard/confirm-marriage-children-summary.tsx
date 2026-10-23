'use client';

import * as React from 'react';
import type { Gender } from '@soulsync/shared-types/partner-preference';
import { formatAgeYmdFromIsoDate } from '@soulsync/shared-types';
import type {
  MarriageRecordArchiveDto,
  MarriageRecordChildDto,
  MarriageRecordDto,
} from '@soulsync/shared-types/marriage-record';
import { compareIsoDates } from '@soulsync/shared-types/marriage-record';
import { buildFamilyChildrenFromRecords } from '@/components/dashboard/marriage-registry-family-children';

function recordsForChildFlattening(
  records: MarriageRecordDto[],
  archives: MarriageRecordArchiveDto[],
): MarriageRecordDto[] {
  const archiveAsRecords: MarriageRecordDto[] = archives.map((archive) => ({
    ...archive,
    slotIndex: archive.originalSlotIndex,
    status: archive.endedStatus,
  }));
  return [...records, ...archiveAsRecords];
}

export function buildMotherNameBySlot(
  records: MarriageRecordDto[],
  archives: MarriageRecordArchiveDto[],
): Map<number, string> {
  const map = new Map<number, string>();
  for (const archive of archives) {
    const name = archive.spouseName?.trim();
    if (name) {
      map.set(archive.originalSlotIndex, name);
    }
  }
  for (const record of records) {
    const name = record.spouseName?.trim();
    if (name) {
      map.set(record.slotIndex, name);
    }
  }
  return map;
}

function resolveMotherDisplayName(
  child: MarriageRecordChildDto,
  gender: Gender | null,
  motherNameBySlot: Map<number, string>,
  profileDisplayName?: string | null,
): string {
  if (gender === 'FEMALE') {
    return profileDisplayName?.trim() || 'You';
  }
  const slot = child.motherSlotIndex ?? 1;
  return motherNameBySlot.get(slot) ?? '—';
}

function sortChildrenForDisplay(children: MarriageRecordChildDto[]): MarriageRecordChildDto[] {
  return [...children].sort((a, b) => {
    const byDob = compareIsoDates(b.dateOfBirth, a.dateOfBirth);
    if (byDob !== 0) {
      return byDob;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function childListKey(child: MarriageRecordChildDto, index: number): string {
  const mother = child.motherSlotIndex ?? 0;
  return `${mother}:${child.name}:${child.dateOfBirth}:${child.gender}:${index}`;
}

type ConfirmMarriageChildrenSummaryProps = {
  gender: Gender | null;
  records: MarriageRecordDto[];
  archives: MarriageRecordArchiveDto[];
  profileDisplayName?: string | null;
};

export function ConfirmMarriageChildrenSummary({
  gender,
  records,
  archives,
  profileDisplayName,
}: ConfirmMarriageChildrenSummaryProps) {
  const children = React.useMemo(() => {
    const flat = buildFamilyChildrenFromRecords(recordsForChildFlattening(records, archives));
    return sortChildrenForDisplay(flat);
  }, [records, archives]);

  const motherNameBySlot = React.useMemo(
    () => buildMotherNameBySlot(records, archives),
    [records, archives],
  );

  if (children.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-semibold text-[var(--muted-foreground)]">Children</h3>
      <ul className="mt-3 space-y-3">
        {children.map((child, index) => {
          const ageYmd = formatAgeYmdFromIsoDate(child.dateOfBirth);
          const ageLabel = ageYmd ?? 'Age —';
          const genderLabel = child.gender === 'FEMALE' ? 'Female' : 'Male';
          const motherName = resolveMotherDisplayName(
            child,
            gender,
            motherNameBySlot,
            profileDisplayName,
          );
          const displayName = child.name.trim() || '—';

          return (
            <li
              key={childListKey(child, index)}
              className="flex flex-col gap-3 rounded-xl border border-[var(--border)]/70 bg-[var(--muted)]/15 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                  {displayName}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {ageLabel} · {genderLabel}
                </p>
              </div>
              <div className="shrink-0 sm:text-right">
                <p className="text-xs font-medium tracking-wide text-[var(--muted-foreground)] uppercase">
                  Mother
                </p>
                <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">{motherName}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
