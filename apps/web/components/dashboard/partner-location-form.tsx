'use client';

import * as React from 'react';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import { LOCATION_DETAILS_MAX_WORDS } from '@soulsync/shared-types/biodata';
import { countWords, limitToMaxWords } from '@soulsync/shared-types/word-limit';
import type { PartnerPreferredLocationEntry } from '@soulsync/shared-types/partner-preference';
import {
  flattenPartnerPreferredLocations,
  getPartnerPreferredLocations,
} from '@soulsync/shared-types/partner-preferences-ui';
import type { GeoCountrySummary } from '@soulsync/shared-types/geo';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  inputWithChevronClass,
  SearchableSelectField,
  SelectWithChevron,
} from '@/components/dashboard/searchable-select-field';
import { useGeoLocation } from '@/lib/geo/use-geo-location';
import { btnPrimaryMd } from '@/lib/ui-classes';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

function formatEntryLine(entry: PartnerPreferredLocationEntry): string {
  return [
    entry.country,
    entry.stateRegion,
    entry.city,
    entry.postalCode,
    entry.locationDetails,
    entry.motherTongue,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .join(' · ');
}

function SavedLocationsList({
  entries,
  onRemove,
}: {
  entries: PartnerPreferredLocationEntry[];
  onRemove: (index: number) => void;
}) {
  if (entries.length === 0) {
    return (
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">None added yet — use Add above.</p>
    );
  }
  return (
    <ul className="mt-3 space-y-2">
      {entries.map((entry, index) => (
        <li
          key={`${formatEntryLine(entry)}-${index}`}
          className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)]/80 bg-white px-3 py-2 text-sm"
        >
          <div className="grid min-w-0 flex-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
            <span>
              <span className="text-muted-foreground text-xs">Country </span>
              {entry.country?.trim() || '—'}
            </span>
            <span>
              <span className="text-muted-foreground text-xs">State </span>
              {entry.stateRegion?.trim() || '—'}
            </span>
            <span>
              <span className="text-muted-foreground text-xs">City </span>
              {entry.city?.trim() || '—'}
            </span>
            <span>
              <span className="text-muted-foreground text-xs">Postal </span>
              {entry.postalCode?.trim() || '—'}
            </span>
            <span className="sm:col-span-2 lg:col-span-3">
              <span className="text-muted-foreground text-xs">Details </span>
              {entry.locationDetails?.trim() || '—'}
            </span>
            <span className="sm:col-span-2">
              <span className="text-muted-foreground text-xs">Mother tongue </span>
              {entry.motherTongue?.trim() || '—'}
            </span>
          </div>
          <button
            type="button"
            className="text-muted-foreground shrink-0 hover:text-[var(--foreground)]"
            aria-label="Remove location"
            onClick={() => onRemove(index)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}

function isAddablePlaceName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.toLowerCase() !== 'unknown';
}

export function PartnerLocationForm({
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
  const [savedLocations, setSavedLocations] = React.useState<PartnerPreferredLocationEntry[]>(() =>
    getPartnerPreferredLocations(partnerPreference),
  );

  const [country, setCountry] = React.useState(profile.country);
  const [stateRegion, setStateRegion] = React.useState(profile.stateRegion ?? '');
  const [stateIso, setStateIso] = React.useState('');
  const [city, setCity] = React.useState(profile.city);
  const [postalCode, setPostalCode] = React.useState(profile.postalCode ?? '');
  const [locationDetails, setLocationDetails] = React.useState(profile.locationDetails ?? '');
  const [motherTongue, setMotherTongue] = React.useState(profile.motherTongue ?? '');
  const [countryFilter, setCountryFilter] = React.useState(profile.country);
  const [countrySuggestOpen, setCountrySuggestOpen] = React.useState(false);
  const [postalHint, setPostalHint] = React.useState<string | null>(null);

  const geo = useGeoLocation({
    countryName: profile.country,
    stateRegion: profile.stateRegion,
  });
  const { loadCountries, selectCountry, selectState } = geo;
  const languageOptions = geo.countryDetail?.languages ?? [];

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadCountries(countryFilter.trim() || undefined);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [countryFilter, loadCountries]);

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

  const countrySuggestions = React.useMemo(() => {
    const q = countryFilter.trim().toLowerCase();
    const list = geo.countries;
    const filtered = q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
    return filtered.slice(0, 12);
  }, [countryFilter, geo.countries]);

  const clearWorkingLocation = React.useCallback(() => {
    setCountry('');
    setCountryFilter('');
    setStateRegion('');
    setStateIso('');
    setCity('');
    setPostalCode('');
    setLocationDetails('');
    setMotherTongue('');
    setPostalHint(null);
  }, []);

  const pickCountry = React.useCallback(
    (entry: GeoCountrySummary) => {
      if (!entry.alpha2) {
        setCountry(entry.name);
        setCountryFilter(entry.name);
        setCountrySuggestOpen(false);
        return;
      }
      setCountry(entry.name);
      setCountryFilter(entry.name);
      setCountrySuggestOpen(false);
      setStateRegion('');
      setStateIso('');
      setCity('');
      setPostalCode('');
      setPostalHint(null);
      void selectCountry(entry.alpha2, entry.name).then((result) => {
        if (result?.defaultMotherTongue) {
          setMotherTongue(result.defaultMotherTongue);
        }
      });
    },
    [selectCountry],
  );

  const stateOptions = React.useMemo(
    () => geo.states.map((s) => ({ value: s.name, label: s.name, data: s.isoCode })),
    [geo.states],
  );

  const cityOptions = React.useMemo(
    () => geo.cities.map((c) => ({ value: c.name, label: c.name })),
    [geo.cities],
  );

  const stateDisabled = !geo.alpha2 || geo.statesLoading || geo.states.length === 0;
  const statePlaceholder = !geo.alpha2
    ? 'Select country first'
    : geo.statesLoading
      ? 'Loading states…'
      : geo.states.length
        ? 'Search or select state…'
        : 'No states for this country';

  const cityDisabled = !activeStateIso || geo.citiesLoading;

  const applyProfileToWorkingForm = () => {
    setCountry(profile.country);
    setCountryFilter(profile.country);
    setStateRegion(profile.stateRegion ?? '');
    setStateIso('');
    setCity(profile.city);
    setPostalCode(profile.postalCode ?? '');
    setLocationDetails(profile.locationDetails ?? '');
    setMotherTongue(profile.motherTongue ?? '');
    setPostalHint(null);
    if (profile.country && profile.country !== 'Unknown') {
      void geo.resolveCountryByName(profile.country).then((match) => {
        if (match?.alpha2) {
          void selectCountry(match.alpha2, match.name, profile.stateRegion ?? undefined);
        }
      });
    }
    const prefDistrict = myPreference?.district?.trim();
    if (prefDistrict && isAddablePlaceName(prefDistrict)) {
      setCity(prefDistrict);
    }
  };

  const addCurrentLocation = () => {
    const countryName = (countryFilter.trim() || country.trim()).trim();
    const cityName = city.trim();
    const stateName = stateRegion.trim();
    const hasCountry = isAddablePlaceName(countryName);
    const hasCity = isAddablePlaceName(cityName);
    const hasState = isAddablePlaceName(stateName);

    if (!hasCountry && !hasCity && !hasState) {
      toast.error('Set at least a valid country or city before adding');
      return;
    }

    const entry: PartnerPreferredLocationEntry = {
      country: hasCountry ? countryName : null,
      stateRegion: stateName || null,
      city: hasCity ? cityName : null,
      postalCode: postalCode.trim() || null,
      locationDetails: locationDetails.trim() || null,
      motherTongue: motherTongue.trim() || null,
    };

    setSavedLocations((prev) => [...prev, entry]);
    clearWorkingLocation();
    toast.success('Added to preferred locations');
  };

  const validatePostal = () => {
    const regex = geo.countryDetail?.postalRegex;
    if (!postalCode.trim() || !regex) {
      setPostalHint(null);
      return;
    }
    try {
      const ok = new RegExp(regex).test(postalCode.trim());
      setPostalHint(ok ? null : 'Postal code does not match the format for this country.');
    } catch {
      setPostalHint(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--muted-foreground)]">
          Set a location below, then click Add. You can add multiple countries and districts.
        </p>
        <button
          type="button"
          className="text-sm font-medium text-[var(--color-brand-700)] hover:underline"
          onClick={() => {
            applyProfileToWorkingForm();
            toast.success('Filled from your profile location');
          }}
        >
          Use my location
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)]/80 bg-[var(--muted)]/20 p-4">
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Location to add</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative sm:col-span-2 lg:col-span-3">
            <Label htmlFor="partnerLocCountryFilter">Country</Label>
            <div className="relative mt-1.5 h-11">
              <input
                id="partnerLocCountryFilter"
                className={inputWithChevronClass}
                value={countryFilter}
                placeholder="Start typing a country name…"
                autoComplete="off"
                role="combobox"
                aria-expanded={countrySuggestOpen}
                aria-controls="partner-loc-country-suggest"
                aria-autocomplete="list"
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCountry(e.target.value);
                  setCountrySuggestOpen(true);
                }}
                onFocus={() => {
                  setCountrySuggestOpen(true);
                  void loadCountries(countryFilter.trim() || undefined);
                }}
                onBlur={() => {
                  window.setTimeout(() => setCountrySuggestOpen(false), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setCountrySuggestOpen(false);
                  }
                }}
              />
              <ChevronDown
                className="pointer-events-none absolute inset-y-0 right-3 my-auto h-4 w-4 text-[var(--muted-foreground)]"
                aria-hidden
              />
              {countrySuggestOpen && (countrySuggestions.length > 0 || geo.countriesLoading) ? (
                <ul
                  id="partner-loc-country-suggest"
                  role="listbox"
                  className={cn(
                    'absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-[var(--radius)]',
                    'border border-[var(--border)] bg-white py-1 shadow-md',
                  )}
                >
                  {geo.countriesLoading && countrySuggestions.length === 0 ? (
                    <li className="text-muted-foreground px-3 py-2 text-sm">Searching…</li>
                  ) : null}
                  {countrySuggestions.map((c) => (
                    <li key={`${c.alpha2}-${c.name}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={country === c.name}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm hover:bg-[var(--muted)]',
                          country === c.name && 'bg-[var(--muted)]/60 font-medium',
                        )}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          pickCountry(c);
                        }}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
                  {!geo.countriesLoading &&
                  countryFilter.trim() &&
                  countrySuggestions.length === 0 ? (
                    <li className="text-muted-foreground px-3 py-2 text-sm">No countries match.</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          </div>

          <SearchableSelectField
            id="partnerLocState"
            label="State / province"
            value={stateRegion}
            options={stateOptions}
            disabled={stateDisabled}
            loading={geo.statesLoading}
            placeholder={statePlaceholder}
            emptyMessage="No states match your search."
            onSelect={(option) => {
              setStateRegion(option.label);
              setStateIso(option.data ?? '');
              setCity('');
              if (option.data) {
                void selectState(option.data);
              }
            }}
          />

          {activeStateIso && geo.cities.length > 0 ? (
            <SearchableSelectField
              id="partnerLocCity"
              label="City"
              value={city}
              options={cityOptions}
              disabled={cityDisabled}
              loading={geo.citiesLoading}
              placeholder={geo.citiesLoading ? 'Loading cities…' : 'Search or select city…'}
              emptyMessage="No cities match your search."
              onSelect={(option) => setCity(option.label)}
            />
          ) : (
            <div>
              <Label htmlFor="partnerLocCityManual">City</Label>
              <input
                id="partnerLocCityManual"
                className={cn(inputClass, 'mt-1.5')}
                value={city}
                disabled={!activeStateIso && !geo.alpha2 && !countryFilter.trim()}
                placeholder={
                  activeStateIso
                    ? 'Enter city name'
                    : geo.alpha2
                      ? 'Select state first'
                      : 'Select or type country first'
                }
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="partnerLocPostal">Postal code</Label>
            <input
              id="partnerLocPostal"
              className={cn(inputClass, 'mt-1.5')}
              value={postalCode}
              placeholder={geo.countryDetail?.postalFormat ?? 'Postal / ZIP code'}
              onChange={(e) => setPostalCode(e.target.value)}
              onBlur={validatePostal}
            />
            {postalHint ? <p className="text-destructive mt-1 text-xs">{postalHint}</p> : null}
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <Label htmlFor="partnerLocDetails">Location details</Label>
            <textarea
              id="partnerLocDetails"
              rows={3}
              className={cn(inputClass, 'mt-1.5 h-auto min-h-[5.5rem] py-2')}
              value={locationDetails}
              placeholder="e.g. house number, village, landmark, area"
              onChange={(e) =>
                setLocationDetails(limitToMaxWords(e.target.value, LOCATION_DETAILS_MAX_WORDS))
              }
            />
            <p className="text-muted-foreground mt-1 text-xs">
              {countWords(locationDetails)} / {LOCATION_DETAILS_MAX_WORDS} words
            </p>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="partnerLocMotherTongue">Mother tongue</Label>
            {languageOptions.length > 0 ? (
              <SelectWithChevron
                id="partnerLocMotherTongue"
                label=""
                aria-label="Mother tongue"
                value={motherTongue}
                onChange={(e) => setMotherTongue(e.target.value)}
              >
                <option value="">Select language</option>
                {languageOptions.map((lang) => (
                  <option key={lang.code} value={lang.name}>
                    {lang.name}
                  </option>
                ))}
              </SelectWithChevron>
            ) : (
              <input
                id="partnerLocMotherTongue"
                className={cn(inputClass, 'mt-1.5')}
                value={motherTongue}
                onChange={(e) => setMotherTongue(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" className={btnPrimaryMd} onClick={addCurrentLocation}>
            Add
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-[var(--foreground)]">Saved partner locations</p>
        <SavedLocationsList
          entries={savedLocations}
          onRemove={(index) => setSavedLocations((prev) => prev.filter((_, i) => i !== index))}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className={btnPrimaryMd}
          disabled={pending}
          onClick={() => {
            const flat = flattenPartnerPreferredLocations(savedLocations);
            onSave({
              ...flat,
              customExpectations: {
                preferredLocations: savedLocations,
                locationFlexibility: null,
              },
            });
          }}
        >
          {pending ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </div>
  );
}
