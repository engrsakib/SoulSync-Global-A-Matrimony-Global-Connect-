'use client';

import * as React from 'react';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import {
  COMPLEXION_PREFERENCE_VALUES,
  EDUCATION_PREFERENCE_VALUES,
  FAMILY_STATUS_PREFERENCE_VALUES,
  MARITAL_STATUS_LABELS,
  MARITAL_STATUS_VALUES,
  OCCUPATION_PREFERENCE_VALUES,
  RELIGION_VALUES,
  type ComplexionPreference,
  type EducationPreference,
  type MaritalStatus,
  type OccupationPreference,
  type Religion,
} from '@soulsync/shared-types/partner-preference';
import {
  COMPLEXION_PREFERENCE_LABELS,
  EDUCATION_PREFERENCE_LABELS,
  FAMILY_STATUS_PREFERENCE_LABELS,
  getPartnerReligiousnessFieldLabel,
  getPartnerReligiousnessOptions,
  isPartnerReligiousnessLevel,
  OCCUPATION_PREFERENCE_LABELS,
  PARTNER_PREFERENCE_NOTES_MAX_WORDS,
  PREFERRED_SKIN_TONE_UI_LABEL,
  resolvePartnerReligiousnessReligion,
} from '@soulsync/shared-types/partner-preferences-ui';
import { RELIGION_LABELS } from '@soulsync/shared-types/religion-branches';
import { countWords, limitToMaxWords } from '@soulsync/shared-types/word-limit';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { toast } from 'sonner';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';
import { cmToFeetInches, parseFeetInchesFields } from '@/lib/height-units';
import { btnPrimaryMd, formControlClass } from '@/lib/ui-classes';

const inputClass = formControlClass;

function toggleInList<T extends string>(list: T[], value: T, checked: boolean): T[] {
  if (checked) {
    return list.includes(value) ? list : [...list, value];
  }
  return list.filter((v) => v !== value);
}

function EnumCheckboxGroup<T extends string>({
  legend,
  values,
  labels,
  selected,
  onChange,
}: {
  legend: string;
  values: readonly T[];
  labels: Record<T, string>;
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {values.map((value) => (
          <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={(e) => onChange(toggleInList(selected, value, e.target.checked))}
            />
            {labels[value]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PartnerPreferencesForm({
  profile,
  partnerPreference,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  partnerPreference: BiodataMeDto['partnerPreference'];
  pending: boolean;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const ce = partnerPreference?.customExpectations ?? {};

  const defaultReligions = (): Religion[] => {
    const existing = partnerPreference?.preferredReligions ?? [];
    if (existing.length > 0) {
      return existing;
    }
    if (profile.religion === 'ISLAM') {
      return ['ISLAM'];
    }
    return [];
  };

  const [minAge, setMinAge] = React.useState(String(partnerPreference?.minAge ?? 21));
  const [maxAge, setMaxAge] = React.useState(String(partnerPreference?.maxAge ?? 35));
  const [minHeightFeet, setMinHeightFeet] = React.useState(() => {
    const cm = partnerPreference?.minHeightCm;
    if (cm == null) {
      return '';
    }
    return String(cmToFeetInches(cm).feet);
  });
  const [minHeightInches, setMinHeightInches] = React.useState(() => {
    const cm = partnerPreference?.minHeightCm;
    if (cm == null) {
      return '';
    }
    return String(cmToFeetInches(cm).inches);
  });
  const [religiousnessLevel, setReligiousnessLevel] = React.useState(
    typeof ce.religiousnessLevel === 'string' ? ce.religiousnessLevel : '',
  );
  const [complexions, setComplexions] = React.useState<ComplexionPreference[]>(
    partnerPreference?.complexions ?? [],
  );
  const [complexionNotes, setComplexionNotes] = React.useState(
    typeof ce.complexionNotes === 'string' ? ce.complexionNotes : '',
  );
  const [maritalStatuses, setMaritalStatuses] = React.useState<MaritalStatus[]>(
    partnerPreference?.maritalStatuses?.length
      ? partnerPreference.maritalStatuses
      : ['NEVER_MARRIED'],
  );
  const [educationLevels, setEducationLevels] = React.useState<EducationPreference[]>(
    partnerPreference?.educationLevels ?? [],
  );
  const [educationNotes, setEducationNotes] = React.useState(
    typeof ce.educationNotes === 'string' ? ce.educationNotes : '',
  );
  const [occupations, setOccupations] = React.useState<OccupationPreference[]>(
    partnerPreference?.occupations ?? [],
  );
  const [professionNotes, setProfessionNotes] = React.useState(
    typeof ce.professionNotes === 'string' ? ce.professionNotes : '',
  );
  const [familyStatus, setFamilyStatus] = React.useState(partnerPreference?.familyStatus ?? '');
  const [preferredReligions, setPreferredReligions] = React.useState<Religion[]>(defaultReligions);
  const [specialQualities, setSpecialQualities] = React.useState(
    typeof ce.specialQualities === 'string' ? ce.specialQualities : '',
  );

  const religiousnessReligion = resolvePartnerReligiousnessReligion(
    profile.religion,
    preferredReligions,
  );
  const religiousnessOptions = getPartnerReligiousnessOptions(profile.gender, {
    seekerReligion: profile.religion,
    preferredReligions,
  });
  const religiousnessFieldLabel = getPartnerReligiousnessFieldLabel(religiousnessReligion);

  const handleSave = () => {
    const min = Number(minAge);
    const max = Number(maxAge);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      toast.error('Enter valid minimum and maximum age');
      return;
    }
    if (min > max) {
      toast.error('Minimum age cannot exceed maximum age');
      return;
    }

    const minHeightCm = parseFeetInchesFields(minHeightFeet, minHeightInches);

    const customExpectations: Record<string, unknown> = {
      religiousnessLevel:
        religiousnessLevel && isPartnerReligiousnessLevel(religiousnessLevel)
          ? religiousnessLevel
          : null,
      complexionNotes: complexionNotes.trim() || null,
      educationNotes: educationNotes.trim() || null,
      professionNotes: professionNotes.trim() || null,
      specialQualities: specialQualities.trim() || null,
    };

    onSave({
      minAge: min,
      maxAge: max,
      minHeightCm,
      complexions,
      maritalStatuses,
      educationLevels,
      occupations,
      familyStatus: familyStatus || null,
      preferredReligions,
      customExpectations,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="partnerMinAge">Minimum age of expected partner</Label>
          <input
            id="partnerMinAge"
            type="number"
            min={18}
            className={cn(inputClass, 'mt-1.5')}
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="partnerMaxAge">Maximum age of expected partner</Label>
          <input
            id="partnerMaxAge"
            type="number"
            min={18}
            className={cn(inputClass, 'mt-1.5')}
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
          />
        </div>

        <div>
          <Label>Minimum height</Label>
          <div className="mt-1.5 flex gap-2">
            <input
              aria-label="Minimum height feet"
              type="number"
              min={0}
              placeholder="ft"
              className={inputClass}
              value={minHeightFeet}
              onChange={(e) => setMinHeightFeet(e.target.value)}
            />
            <input
              aria-label="Minimum height inches"
              type="number"
              min={0}
              max={11}
              placeholder="in"
              className={inputClass}
              value={minHeightInches}
              onChange={(e) => setMinHeightInches(e.target.value)}
            />
          </div>
        </div>

        <SelectWithChevron
          id="religiousnessLevel"
          label={religiousnessFieldLabel}
          value={religiousnessLevel}
          onChange={(e) => setReligiousnessLevel(e.target.value)}
        >
          <option value="">—</option>
          {religiousnessOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </SelectWithChevron>

        <EnumCheckboxGroup
          legend={PREFERRED_SKIN_TONE_UI_LABEL}
          values={COMPLEXION_PREFERENCE_VALUES}
          labels={COMPLEXION_PREFERENCE_LABELS}
          selected={complexions}
          onChange={setComplexions}
        />

        <div className="sm:col-span-2">
          <Label htmlFor="complexionNotes">Preferred skin tone notes (optional)</Label>
          <input
            id="complexionNotes"
            className={cn(inputClass, 'mt-1.5')}
            value={complexionNotes}
            onChange={(e) =>
              setComplexionNotes(
                limitToMaxWords(e.target.value, PARTNER_PREFERENCE_NOTES_MAX_WORDS),
              )
            }
            placeholder="e.g. fair, bright tan, or any"
          />
        </div>

        <EnumCheckboxGroup
          legend="Expected marital status"
          values={MARITAL_STATUS_VALUES}
          labels={MARITAL_STATUS_LABELS}
          selected={maritalStatuses}
          onChange={setMaritalStatuses}
        />

        <EnumCheckboxGroup
          legend="Expected education level"
          values={EDUCATION_PREFERENCE_VALUES}
          labels={EDUCATION_PREFERENCE_LABELS}
          selected={educationLevels}
          onChange={setEducationLevels}
        />

        <div className="sm:col-span-2">
          <Label htmlFor="educationNotes">Education notes (optional)</Label>
          <textarea
            id="educationNotes"
            rows={2}
            className={cn(inputClass, 'mt-1.5 h-auto min-h-[4rem] py-2')}
            value={educationNotes}
            onChange={(e) =>
              setEducationNotes(limitToMaxWords(e.target.value, PARTNER_PREFERENCE_NOTES_MAX_WORDS))
            }
            placeholder="e.g. graduate, Kamil, or at least Alim pass"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {countWords(educationNotes)} / {PARTNER_PREFERENCE_NOTES_MAX_WORDS} words
          </p>
        </div>

        <EnumCheckboxGroup
          legend="Expected profession"
          values={OCCUPATION_PREFERENCE_VALUES}
          labels={OCCUPATION_PREFERENCE_LABELS}
          selected={occupations}
          onChange={setOccupations}
        />

        <div className="sm:col-span-2">
          <Label htmlFor="professionNotes">Profession notes (optional)</Label>
          <textarea
            id="professionNotes"
            rows={2}
            className={cn(inputClass, 'mt-1.5 h-auto min-h-[4rem] py-2')}
            value={professionNotes}
            onChange={(e) =>
              setProfessionNotes(
                limitToMaxWords(e.target.value, PARTNER_PREFERENCE_NOTES_MAX_WORDS),
              )
            }
            placeholder="e.g. government or private job, imam or madrasa teacher"
          />
        </div>

        <SelectWithChevron
          id="familyStatus"
          label="Expected financial / family status"
          value={familyStatus}
          onChange={(e) => setFamilyStatus(e.target.value)}
        >
          <option value="">—</option>
          {FAMILY_STATUS_PREFERENCE_VALUES.map((value) => (
            <option key={value} value={value}>
              {FAMILY_STATUS_PREFERENCE_LABELS[value]}
            </option>
          ))}
        </SelectWithChevron>

        <EnumCheckboxGroup
          legend="Preferred religions"
          values={RELIGION_VALUES}
          labels={RELIGION_LABELS}
          selected={preferredReligions}
          onChange={setPreferredReligions}
        />

        <div className="sm:col-span-2">
          <Label htmlFor="specialQualities">
            Special qualities or conditions in your expected partner
          </Label>
          <textarea
            id="specialQualities"
            rows={4}
            className={cn(inputClass, 'mt-1.5 h-auto min-h-[6rem] py-2')}
            value={specialQualities}
            onChange={(e) =>
              setSpecialQualities(
                limitToMaxWords(e.target.value, PARTNER_PREFERENCE_NOTES_MAX_WORDS),
              )
            }
            placeholder="e.g. calm nature; mindset to serve parents"
          />
          <p className="text-muted-foreground mt-1 text-xs">
            {countWords(specialQualities)} / {PARTNER_PREFERENCE_NOTES_MAX_WORDS} words
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" className={btnPrimaryMd} disabled={pending} onClick={handleSave}>
          {pending ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </div>
  );
}
