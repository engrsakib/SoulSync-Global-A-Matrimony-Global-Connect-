'use client';

import * as React from 'react';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { RELIGION_VALUES, type Religion } from '@soulsync/shared-types/partner-preference';
import {
  getReligionBranchOptions,
  ISLAM_MADHAB_OPTIONS,
  RELIGION_LABELS,
  usesIslamMadhabField,
} from '@soulsync/shared-types/religion-branches';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';
import { btnPrimaryMd } from '@/lib/ui-classes';
import {
  BIODATA_COMMUNITY_MAX_WORDS,
  countWords,
  limitToMaxWords,
} from '@soulsync/shared-types/word-limit';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

type SaveRowProps = {
  pending: boolean;
  onSave: () => void;
};

function SaveRow({ pending, onSave }: SaveRowProps) {
  return (
    <div className="mt-4 flex justify-end sm:col-span-2">
      <button type="button" className={btnPrimaryMd} disabled={pending} onClick={onSave}>
        {pending ? 'Saving…' : 'Save section'}
      </button>
    </div>
  );
}

export function ReligionPracticeForm({
  profile,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [religion, setReligion] = React.useState<Religion>(profile.religion);
  const [branch, setBranch] = React.useState(profile.denomination ?? '');
  const [madhab, setMadhab] = React.useState(() =>
    usesIslamMadhabField(profile.religion, profile.denomination) &&
    profile.religiousPractice &&
    ISLAM_MADHAB_OPTIONS.some((o) => o.value === profile.religiousPractice)
      ? profile.religiousPractice
      : '',
  );
  const [practiceNotes, setPracticeNotes] = React.useState(() =>
    usesIslamMadhabField(profile.religion, profile.denomination)
      ? ''
      : (profile.religiousPractice ?? ''),
  );
  const [traditionNotes, setTraditionNotes] = React.useState(() => {
    const branches = getReligionBranchOptions(profile.religion);
    if (branches.length > 0) {
      return '';
    }
    return profile.denomination ?? '';
  });
  const [community, setCommunity] = React.useState(profile.community ?? '');

  const branchOptions = React.useMemo(() => getReligionBranchOptions(religion), [religion]);
  const showBranchSelect = branchOptions.length > 0;
  const showMadhab = usesIslamMadhabField(religion, branch || null);
  const showPracticeText = !showMadhab;

  const handleReligionChange = (next: Religion) => {
    setReligion(next);
    setBranch('');
    setMadhab('');
    setPracticeNotes('');
    setTraditionNotes('');
  };

  const handleBranchChange = (next: string) => {
    setBranch(next);
    if (!usesIslamMadhabField(religion, next || null)) {
      setMadhab('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectWithChevron
          id="religion"
          label="Faith tradition"
          value={religion}
          onChange={(e) => handleReligionChange(e.target.value as Religion)}
        >
          {RELIGION_VALUES.map((value) => (
            <option key={value} value={value}>
              {RELIGION_LABELS[value]}
            </option>
          ))}
        </SelectWithChevron>

        {showBranchSelect ? (
          <SelectWithChevron
            id="denomination"
            label="Branch / tradition"
            value={branch}
            onChange={(e) => handleBranchChange(e.target.value)}
          >
            <option value="">—</option>
            {branchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectWithChevron>
        ) : (
          <div>
            <Label htmlFor="traditionNotes">Tradition / notes (optional)</Label>
            <input
              id="traditionNotes"
              className={inputClass}
              value={traditionNotes}
              onChange={(e) => setTraditionNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        )}

        {showMadhab ? (
          <SelectWithChevron
            id="madhab"
            label="School of jurisprudence (madhab)"
            value={madhab}
            onChange={(e) => setMadhab(e.target.value)}
          >
            <option value="">—</option>
            {ISLAM_MADHAB_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectWithChevron>
        ) : null}

        {showMadhab ? (
          <p className="text-muted-foreground text-xs sm:col-span-2">
            Madhab is optional. It helps families find compatible matches within Sunni Islam.
          </p>
        ) : null}

        {showPracticeText ? (
          <div className="sm:col-span-2">
            <Label htmlFor="religiousPractice">Practice / observance (optional)</Label>
            <textarea
              id="religiousPractice"
              rows={3}
              className={cn(inputClass, 'h-auto min-h-[5.5rem] py-2')}
              value={practiceNotes}
              onChange={(e) => setPracticeNotes(e.target.value)}
              placeholder="Optional — e.g. level of observance, dietary habits"
            />
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <Label htmlFor="community">Community (optional)</Label>
          <textarea
            id="community"
            rows={4}
            className={cn(inputClass, 'h-auto min-h-[6rem] py-2')}
            value={community}
            onChange={(e) => {
              const next = limitToMaxWords(e.target.value, BIODATA_COMMUNITY_MAX_WORDS);
              setCommunity(next);
            }}
            placeholder="Optional — community or sect if relevant (max 300 words)"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {countWords(community)} / {BIODATA_COMMUNITY_MAX_WORDS} words
          </p>
        </div>
      </div>

      <SaveRow
        pending={pending}
        onSave={() => {
          const denomination = showBranchSelect ? branch || null : traditionNotes.trim() || null;
          const religiousPractice = showMadhab ? madhab || null : practiceNotes.trim() || null;

          onSave({
            religion,
            denomination,
            religiousPractice,
            community: community.trim() || null,
          });
        }}
      />
    </div>
  );
}
