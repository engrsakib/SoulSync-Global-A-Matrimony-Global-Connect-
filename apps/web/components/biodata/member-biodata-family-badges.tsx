'use client';

import * as React from 'react';
import type {
  MemberBiodataFamilySpouseLineDto,
  MemberBiodataFamilySummaryDto,
} from '@soulsync/shared-types/biodata-view';
import { Badge } from '@soulsync/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@soulsync/ui/tooltip';
import { cn } from '@soulsync/ui/lib/utils';

function pluralSpouseTerm(term: 'wife' | 'husband', count: number): string {
  if (term === 'wife') {
    return count === 1 ? 'wife' : 'wives';
  }
  return count === 1 ? 'husband' : 'husbands';
}

function formatSpouseLine(line: MemberBiodataFamilySpouseLineDto): string {
  const parts = [line.label];
  if (line.marriageDate) {
    parts.push(`since ${line.marriageDate}`);
  }
  if (line.endedDate) {
    parts.push(`ended ${line.endedDate}`);
  }
  return parts.join(' · ');
}

function SpouseSection({
  title,
  lines,
}: {
  title: string;
  lines: MemberBiodataFamilySpouseLineDto[];
}) {
  if (lines.length === 0) {
    return null;
  }
  return (
    <div className="space-y-1">
      <p className="font-semibold text-[var(--foreground)]">{title}</p>
      <ul className="space-y-0.5 text-[var(--muted-foreground)]">
        {lines.map((line, index) => (
          <li key={`${line.label}-${line.marriageDate ?? ''}-${index}`}>
            {formatSpouseLine(line)}
          </li>
        ))}
      </ul>
    </div>
  );
}

type MemberBiodataFamilyBadgesProps = {
  summary: MemberBiodataFamilySummaryDto | null;
  className?: string;
};

export function MemberBiodataFamilyBadges({ summary, className }: MemberBiodataFamilyBadgesProps) {
  if (!summary) {
    return null;
  }

  const totalChildren = summary.maleChildrenCount + summary.femaleChildrenCount;
  const pastMarriageCount = summary.divorcedSpouseCount + summary.deceasedSpouseCount;

  const showActiveSpouseBadge = summary.activeSpouseCount > 0;
  const showChildrenBadge = totalChildren > 0;
  const showPastBadge = !showActiveSpouseBadge && !showChildrenBadge && pastMarriageCount > 0;

  if (!showActiveSpouseBadge && !showChildrenBadge && !showPastBadge) {
    return null;
  }

  const spousePlural = pluralSpouseTerm(summary.spouseTerm, summary.activeSpouseCount);
  const currentTitle =
    summary.spouseTerm === 'wife'
      ? summary.activeSpouseCount === 1
        ? 'Current wife'
        : 'Current wives'
      : summary.activeSpouseCount === 1
        ? 'Current husband'
        : 'Current husbands';

  const childParts: string[] = [];
  if (summary.maleChildrenCount > 0) {
    childParts.push(
      `${summary.maleChildrenCount} ${summary.maleChildrenCount === 1 ? 'son' : 'sons'}`,
    );
  }
  if (summary.femaleChildrenCount > 0) {
    childParts.push(
      `${summary.femaleChildrenCount} ${summary.femaleChildrenCount === 1 ? 'daughter' : 'daughters'}`,
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'mt-2 flex flex-wrap items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
              className,
            )}
            tabIndex={0}
            aria-label="Family summary. Hover or focus for details."
          >
            {showActiveSpouseBadge ? (
              <Badge
                variant="outline"
                className="border-[var(--border)] bg-[var(--muted)]/40 font-medium"
              >
                {summary.activeSpouseCount} {spousePlural}
              </Badge>
            ) : null}
            {showChildrenBadge ? (
              <Badge
                variant="outline"
                className="border-[var(--border)] bg-[var(--muted)]/40 font-medium"
              >
                {totalChildren} {totalChildren === 1 ? 'child' : 'children'}
              </Badge>
            ) : null}
            {showPastBadge ? (
              <Badge
                variant="outline"
                className="border-[var(--border)] bg-[var(--muted)]/40 font-medium"
              >
                Past marriages · {pastMarriageCount}
              </Badge>
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-sm space-y-3 p-3">
          {summary.activeSpouseCount > 0 ? (
            <SpouseSection title={currentTitle} lines={summary.activeSpouses} />
          ) : null}
          {summary.divorcedSpouseCount > 0 ? (
            <SpouseSection
              title={`Divorced · ${summary.divorcedSpouseCount}`}
              lines={summary.divorcedSpouses}
            />
          ) : null}
          {summary.deceasedSpouseCount > 0 ? (
            <SpouseSection
              title={`Deceased · ${summary.deceasedSpouseCount}`}
              lines={summary.deceasedSpouses}
            />
          ) : null}
          {totalChildren > 0 ? (
            <div>
              <p className="font-semibold text-[var(--foreground)]">Children</p>
              <p className="mt-0.5 text-[var(--muted-foreground)]">{childParts.join(' · ')}</p>
            </div>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
