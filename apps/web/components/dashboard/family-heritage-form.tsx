'use client';

import * as React from 'react';
import type {
  BiodataFamilyHeritageSectionPatch,
  BiodataMeDto,
} from '@soulsync/shared-types/biodata';
import {
  FAMILY_ECONOMIC_CLASS_LABELS,
  FAMILY_ECONOMIC_CLASS_VALUES,
  FAMILY_HERITAGE_MAX_RELATIVES,
  FAMILY_HERITAGE_TEXT_MAX_WORDS,
  FAMILY_RELATIVE_RELATIONSHIP_LABELS,
  FAMILY_RELATIVE_RELATIONSHIP_VALUES,
  type FamilyEconomicClass,
  type FamilyRelativeEntry,
  type FamilyRelativeRelationship,
} from '@soulsync/shared-types/family-heritage';
import { countWords, limitToMaxWords } from '@soulsync/shared-types/word-limit';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';
import { btnPrimaryMd } from '@/lib/ui-classes';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

const sectionSubheadingClass = 'text-sm font-semibold tracking-tight text-[var(--foreground)]';

function aliveSelectValue(value: boolean | null): string {
  if (value === true) {
    return 'yes';
  }
  if (value === false) {
    return 'no';
  }
  return '';
}

function aliveFromSelect(value: string): boolean | null {
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  return null;
}

function parseOptionalCount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return n;
}

function newRelative(): FamilyRelativeEntry {
  return {
    id: crypto.randomUUID(),
    relationship: 'BROTHER',
    name: '',
    education: '',
    profession: '',
  };
}

function WordLimitedTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={4}
        className={cn(inputClass, 'mt-1.5 h-auto min-h-[6rem] py-2')}
        value={value}
        onChange={(e) => onChange(limitToMaxWords(e.target.value, FAMILY_HERITAGE_TEXT_MAX_WORDS))}
        placeholder={placeholder}
      />
      <p className="text-muted-foreground mt-1 text-xs">
        {countWords(value)} / {FAMILY_HERITAGE_TEXT_MAX_WORDS} words
      </p>
    </div>
  );
}

type SaveRowProps = {
  pending: boolean;
  onSave: () => void;
};

function SaveRow({ pending, onSave }: SaveRowProps) {
  return (
    <div className="flex justify-end">
      <button type="button" className={btnPrimaryMd} disabled={pending} onClick={onSave}>
        {pending ? 'Saving…' : 'Save section'}
      </button>
    </div>
  );
}

export function FamilyHeritageForm({
  profile,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  pending: boolean;
  onSave: (body: BiodataFamilyHeritageSectionPatch) => void;
}) {
  const [fatherIsAlive, setFatherIsAlive] = React.useState(() =>
    aliveSelectValue(profile.fatherIsAlive),
  );
  const [fatherProfession, setFatherProfession] = React.useState(profile.fatherProfession ?? '');
  const [motherIsAlive, setMotherIsAlive] = React.useState(() =>
    aliveSelectValue(profile.motherIsAlive),
  );
  const [motherProfession, setMotherProfession] = React.useState(profile.motherProfession ?? '');
  const [brotherCount, setBrotherCount] = React.useState(
    profile.brotherCount != null ? String(profile.brotherCount) : '',
  );
  const [sisterCount, setSisterCount] = React.useState(
    profile.sisterCount != null ? String(profile.sisterCount) : '',
  );
  const [relatives, setRelatives] = React.useState<FamilyRelativeEntry[]>(() =>
    profile.familyRelatives.length > 0 ? profile.familyRelatives.map((r) => ({ ...r })) : [],
  );
  const [unclesOccupations, setUnclesOccupations] = React.useState(profile.unclesOccupations ?? '');
  const [residenceDescription, setResidenceDescription] = React.useState(
    profile.residenceDescription ?? '',
  );
  const [familyEconomicClass, setFamilyEconomicClass] = React.useState(
    profile.familyEconomicClass ?? '',
  );

  const updateRelative = (id: string, patch: Partial<FamilyRelativeEntry>) => {
    setRelatives((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRelative = (id: string) => {
    setRelatives((prev) => prev.filter((r) => r.id !== id));
  };

  const addRelative = () => {
    setRelatives((prev) => {
      if (prev.length >= FAMILY_HERITAGE_MAX_RELATIVES) {
        return prev;
      }
      return [...prev, newRelative()];
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className={sectionSubheadingClass}>Parents and siblings</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectWithChevron
            id="fatherIsAlive"
            label="Is your father alive?"
            value={fatherIsAlive}
            onChange={(e) => setFatherIsAlive(e.target.value)}
          >
            <option value="">—</option>
            <option value="yes">Yes, alive</option>
            <option value="no">No, deceased</option>
          </SelectWithChevron>

          <div>
            <Label htmlFor="fatherProfession">Father&apos;s profession (details)</Label>
            <input
              id="fatherProfession"
              className={cn(inputClass, 'mt-1.5')}
              value={fatherProfession}
              onChange={(e) =>
                setFatherProfession(limitToMaxWords(e.target.value, FAMILY_HERITAGE_TEXT_MAX_WORDS))
              }
              placeholder="Optional"
            />
          </div>

          <SelectWithChevron
            id="motherIsAlive"
            label="Is your mother alive?"
            value={motherIsAlive}
            onChange={(e) => setMotherIsAlive(e.target.value)}
          >
            <option value="">—</option>
            <option value="yes">Yes, alive</option>
            <option value="no">No, deceased</option>
          </SelectWithChevron>

          <div>
            <Label htmlFor="motherProfession">Mother&apos;s profession (details)</Label>
            <input
              id="motherProfession"
              className={cn(inputClass, 'mt-1.5')}
              value={motherProfession}
              onChange={(e) =>
                setMotherProfession(limitToMaxWords(e.target.value, FAMILY_HERITAGE_TEXT_MAX_WORDS))
              }
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="brotherCount">How many brothers?</Label>
            <input
              id="brotherCount"
              type="number"
              min={0}
              className={cn(inputClass, 'mt-1.5')}
              value={brotherCount}
              onChange={(e) => setBrotherCount(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label htmlFor="sisterCount">How many sisters?</Label>
            <input
              id="sisterCount"
              type="number"
              min={0}
              className={cn(inputClass, 'mt-1.5')}
              value={sisterCount}
              onChange={(e) => setSisterCount(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className={sectionSubheadingClass}>Siblings and relatives</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Add as many siblings or uncles as you need, one at a time.
          </p>
        </div>

        {relatives.length === 0 ? (
          <p className="text-muted-foreground text-sm">No members added yet.</p>
        ) : (
          <ul className="space-y-4">
            {relatives.map((member, index) => (
              <li
                key={member.id}
                className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
              >
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="inline-flex rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]">
                    Member {index + 1}
                  </span>
                  <button
                    type="button"
                    className="text-destructive text-sm font-medium hover:underline"
                    onClick={() => removeRelative(member.id)}
                  >
                    Delete
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectWithChevron
                    id={`relative-relationship-${member.id}`}
                    label="Relationship"
                    value={member.relationship}
                    onChange={(e) =>
                      updateRelative(member.id, {
                        relationship: e.target.value as FamilyRelativeRelationship,
                      })
                    }
                  >
                    {FAMILY_RELATIVE_RELATIONSHIP_VALUES.map((value) => (
                      <option key={value} value={value}>
                        {FAMILY_RELATIVE_RELATIONSHIP_LABELS[value]}
                      </option>
                    ))}
                  </SelectWithChevron>

                  <div>
                    <Label htmlFor={`relative-name-${member.id}`}>Name</Label>
                    <input
                      id={`relative-name-${member.id}`}
                      className={cn(inputClass, 'mt-1.5')}
                      value={member.name}
                      onChange={(e) => updateRelative(member.id, { name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`relative-education-${member.id}`}>Education</Label>
                    <input
                      id={`relative-education-${member.id}`}
                      className={cn(inputClass, 'mt-1.5')}
                      value={member.education}
                      onChange={(e) => updateRelative(member.id, { education: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`relative-profession-${member.id}`}>Profession</Label>
                    <input
                      id={`relative-profession-${member.id}`}
                      className={cn(inputClass, 'mt-1.5')}
                      value={member.profession}
                      onChange={(e) => updateRelative(member.id, { profession: e.target.value })}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          disabled={relatives.length >= FAMILY_HERITAGE_MAX_RELATIVES}
          className={cn(
            'flex h-11 w-full items-center justify-center rounded-[var(--radius)] border border-dashed border-[var(--border)]',
            'text-sm font-medium text-[var(--foreground)] transition-colors',
            'hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-50',
          )}
          onClick={addRelative}
        >
          + Add another person
        </button>
        {relatives.length >= FAMILY_HERITAGE_MAX_RELATIVES ? (
          <p className="text-muted-foreground text-xs">
            Maximum {FAMILY_HERITAGE_MAX_RELATIVES} members.
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <h3 className={sectionSubheadingClass}>Home and economic background</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="unclesOccupations"
              label="Occupations of paternal and maternal uncles"
              value={unclesOccupations}
              onChange={setUnclesOccupations}
              placeholder="Optional"
            />
          </div>

          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="residenceDescription"
              label="Type of residence (describe your home)"
              value={residenceDescription}
              onChange={setResidenceDescription}
              placeholder="Optional"
            />
          </div>

          <SelectWithChevron
            id="familyEconomicClass"
            label="Family economic class"
            value={familyEconomicClass}
            onChange={(e) => setFamilyEconomicClass(e.target.value)}
          >
            <option value="">—</option>
            {FAMILY_ECONOMIC_CLASS_VALUES.map((value) => (
              <option key={value} value={value}>
                {FAMILY_ECONOMIC_CLASS_LABELS[value]}
              </option>
            ))}
          </SelectWithChevron>
        </div>
      </div>

      <SaveRow
        pending={pending}
        onSave={() => {
          onSave({
            fatherIsAlive: aliveFromSelect(fatherIsAlive),
            fatherProfession: fatherProfession.trim() || null,
            motherIsAlive: aliveFromSelect(motherIsAlive),
            motherProfession: motherProfession.trim() || null,
            brotherCount: parseOptionalCount(brotherCount),
            sisterCount: parseOptionalCount(sisterCount),
            familyRelatives: relatives,
            unclesOccupations: unclesOccupations.trim() || null,
            residenceDescription: residenceDescription.trim() || null,
            familyEconomicClass: (familyEconomicClass || null) as FamilyEconomicClass | null,
          });
        }}
      />
    </div>
  );
}
