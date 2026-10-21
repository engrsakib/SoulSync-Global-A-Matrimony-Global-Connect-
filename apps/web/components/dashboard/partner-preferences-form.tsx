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
import { useGeoLocation } from '@/lib/geo/use-geo-location';
import { cmToFeetInches, parseFeetInchesFields } from '@/lib/height-units';
import { btnPrimaryMd } from '@/lib/ui-classes';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

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

function ChipList({ items, onRemove }: { items: string[]; onRemove: (item: string) => void }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-0.5 text-xs font-medium"
        >
          {item}
          <button
            type="button"
            className="text-muted-foreground hover:text-[var(--foreground)]"
            aria-label={`Remove ${item}`}
            onClick={() => onRemove(item)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

export function PartnerPreferencesForm({
  profile,
  myPreference,
  partnerPreference,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  myPreference: BiodataMeDto['myPreference'];
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
  const [preferredCountries, setPreferredCountries] = React.useState<string[]>(
    partnerPreference?.preferredCountries ?? [],
  );
  const [preferredDistricts, setPreferredDistricts] = React.useState<string[]>(
    partnerPreference?.preferredDistricts ?? [],
  );
  const [openToAnyDistrict, setOpenToAnyDistrict] = React.useState(
    ce.locationFlexibility === 'ANY_DISTRICT',
  );
  const [specialQualities, setSpecialQualities] = React.useState(
    typeof ce.specialQualities === 'string' ? ce.specialQualities : '',
  );

  const [geoCountry, setGeoCountry] = React.useState(profile.country);
  const [stateIso, setStateIso] = React.useState('');
  const [stateRegion, setStateRegion] = React.useState(profile.stateRegion ?? '');

  const geo = useGeoLocation({
    countryName: profile.country,
    stateRegion: profile.stateRegion,
  });

  React.useEffect(() => {
    void geo.loadCountries();
  }, [geo]);

  const activeStateIso = React.useMemo(() => {
    if (stateIso) {
      return stateIso;
    }
    if (!stateRegion.trim()) {
      return '';
    }
    return (
      geo.states.find((s) => s.name.toLowerCase() === stateRegion.trim().toLowerCase())?.isoCode ??
      ''
    );
  }, [stateIso, stateRegion, geo.states]);

  const religiousnessReligion = resolvePartnerReligiousnessReligion(
    profile.religion,
    preferredReligions,
  );
  const religiousnessOptions = getPartnerReligiousnessOptions(profile.gender, {
    seekerReligion: profile.religion,
    preferredReligions,
  });
  const religiousnessFieldLabel = getPartnerReligiousnessFieldLabel(religiousnessReligion);

  const addDistrict = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || preferredDistricts.includes(trimmed)) {
      return;
    }
    setPreferredDistricts((prev) => [...prev, trimmed]);
    setOpenToAnyDistrict(false);
  };

  const useMyLocation = () => {
    const country = profile.country?.trim();
    if (country && country !== 'Unknown') {
      setPreferredCountries((prev) => (prev.includes(country) ? prev : [...prev, country]));
    }
    if (profile.city?.trim()) {
      addDistrict(profile.city.trim());
    }
    if (myPreference?.district?.trim()) {
      addDistrict(myPreference.district.trim());
    }
    toast.success('Applied your profile location');
  };

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
      locationFlexibility: openToAnyDistrict ? 'ANY_DISTRICT' : null,
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
      preferredCountries,
      preferredDistricts: openToAnyDistrict ? [] : preferredDistricts,
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

        <div className="space-y-3 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>Preferred countries & districts</Label>
            <button
              type="button"
              className="text-sm font-medium text-[var(--color-brand-700)] hover:underline"
              onClick={useMyLocation}
            >
              Use my location
            </button>
          </div>

          <ChipList
            items={preferredCountries}
            onRemove={(c) => setPreferredCountries((prev) => prev.filter((x) => x !== c))}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SelectWithChevron
              id="geoCountryPick"
              label="Country (for district list)"
              value={geoCountry}
              onChange={(e) => {
                const name = e.target.value;
                setGeoCountry(name);
                void geo.resolveCountryByName(name).then((match) => {
                  if (match?.alpha2) {
                    void geo.selectCountry(match.alpha2, match.name, stateRegion);
                  }
                });
              }}
            >
              <option value="">—</option>
              {geo.countries.map((c) => (
                <option key={c.alpha2 || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </SelectWithChevron>

            <SelectWithChevron
              id="geoStatePick"
              label="State / region"
              value={activeStateIso}
              disabled={!geo.states.length}
              onChange={(e) => {
                const iso = e.target.value;
                setStateIso(iso);
                const state = geo.states.find((s) => s.isoCode === iso);
                if (state) {
                  setStateRegion(state.name);
                  void geo.selectState(iso);
                }
              }}
            >
              <option value="">—</option>
              {geo.states.map((s) => (
                <option key={s.isoCode} value={s.isoCode}>
                  {s.name}
                </option>
              ))}
            </SelectWithChevron>

            <SelectWithChevron
              id="geoCityPick"
              label="Add district / city"
              value=""
              disabled={!geo.cities.length}
              onChange={(e) => {
                if (e.target.value) {
                  addDistrict(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">Select to add…</option>
              {geo.cities.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </SelectWithChevron>

            <div className="flex items-end">
              <button
                type="button"
                className={cn(inputClass, 'h-11 justify-center text-sm font-medium')}
                disabled={!geoCountry.trim() || geoCountry === 'Unknown'}
                onClick={() => {
                  const name = geoCountry.trim();
                  if (name && !preferredCountries.includes(name)) {
                    setPreferredCountries((prev) => [...prev, name]);
                  }
                }}
              >
                Add country
              </button>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            e.g. Dhaka, Cumilla, Noakhali, or any district
          </p>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={openToAnyDistrict}
              onChange={(e) => {
                setOpenToAnyDistrict(e.target.checked);
                if (e.target.checked) {
                  setPreferredDistricts([]);
                }
              }}
            />
            Open to any district
          </label>

          {!openToAnyDistrict ? (
            <ChipList
              items={preferredDistricts}
              onRemove={(d) => setPreferredDistricts((prev) => prev.filter((x) => x !== d))}
            />
          ) : null}
        </div>

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
