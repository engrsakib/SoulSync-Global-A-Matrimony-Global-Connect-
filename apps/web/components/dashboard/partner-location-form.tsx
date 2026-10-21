'use client';

import * as React from 'react';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import type { GeoCountrySummary } from '@soulsync/shared-types/geo';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  inputWithChevronClass,
  SearchableSelectField,
} from '@/components/dashboard/searchable-select-field';
import { useGeoLocation } from '@/lib/geo/use-geo-location';
import { btnPrimaryMd } from '@/lib/ui-classes';

const inputClass = cn(
  'flex h-11 w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
);

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
  const [preferredCountries, setPreferredCountries] = React.useState<string[]>(
    partnerPreference?.preferredCountries ?? [],
  );
  const [preferredDistricts, setPreferredDistricts] = React.useState<string[]>(
    partnerPreference?.preferredDistricts ?? [],
  );

  const [country, setCountry] = React.useState(
    profile.country && profile.country !== 'Unknown' ? profile.country : '',
  );
  const [stateRegion, setStateRegion] = React.useState(profile.stateRegion ?? '');
  const [stateIso, setStateIso] = React.useState('');
  const [city, setCity] = React.useState('');
  const [countryFilter, setCountryFilter] = React.useState(() =>
    profile.country && profile.country !== 'Unknown' ? profile.country : '',
  );
  const [countrySuggestOpen, setCountrySuggestOpen] = React.useState(false);

  const geo = useGeoLocation({
    countryName: profile.country,
    stateRegion: profile.stateRegion,
  });
  const { loadCountries, selectCountry, selectState } = geo;

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

  const appendCountry = React.useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === 'Unknown') {
      return;
    }
    setPreferredCountries((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  const appendDistrict = React.useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setPreferredDistricts((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  const pickCountry = React.useCallback(
    (entry: GeoCountrySummary) => {
      setCountry(entry.name);
      setCountryFilter(entry.name);
      setCountrySuggestOpen(false);
      setStateRegion('');
      setStateIso('');
      setCity('');
      appendCountry(entry.name);
      if (entry.alpha2) {
        void selectCountry(entry.alpha2, entry.name);
      }
    },
    [appendCountry, selectCountry],
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

  const useMyLocation = () => {
    const profileCountry = profile.country?.trim();
    if (profileCountry && profileCountry !== 'Unknown') {
      appendCountry(profileCountry);
      setCountry(profileCountry);
      setCountryFilter(profileCountry);
    }
    if (profile.city?.trim()) {
      appendDistrict(profile.city.trim());
    }
    if (myPreference?.district?.trim()) {
      appendDistrict(myPreference.district.trim());
    }
    toast.success('Applied your profile location');
  };

  const addCurrentDistrict = () => {
    const name = city.trim();
    if (!name) {
      toast.error('Select or enter a district / city first');
      return;
    }
    appendDistrict(name);
    setCity('');
    toast.success('District added');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--muted-foreground)]">
          Add one or more countries and districts where you prefer to find a partner.
        </p>
        <button
          type="button"
          className="text-sm font-medium text-[var(--color-brand-700)] hover:underline"
          onClick={useMyLocation}
        >
          Use my location
        </button>
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--muted-foreground)]">Preferred countries</p>
        <ChipList
          items={preferredCountries}
          onRemove={(c) => setPreferredCountries((prev) => prev.filter((x) => x !== c))}
        />
        {preferredCountries.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">None added yet.</p>
        ) : null}
      </div>

      <div>
        <p className="text-xs font-medium text-[var(--muted-foreground)]">Preferred districts</p>
        <ChipList
          items={preferredDistricts}
          onRemove={(d) => setPreferredDistricts((prev) => prev.filter((x) => x !== d))}
        />
        {preferredDistricts.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">None added yet.</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="relative sm:col-span-2">
          <Label htmlFor="partnerLocCountryFilter">Country</Label>
          <p className="text-muted-foreground mb-1.5 text-xs">
            Pick a country to load states and add it to your preferred list.
          </p>
          <div className="relative h-11">
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
            label="District / city"
            value={city}
            options={cityOptions}
            disabled={cityDisabled}
            loading={geo.citiesLoading}
            placeholder={geo.citiesLoading ? 'Loading cities…' : 'Search or select district…'}
            emptyMessage="No cities match your search."
            onSelect={(option) => setCity(option.label)}
          />
        ) : (
          <div>
            <Label htmlFor="partnerLocCityManual">District / city</Label>
            <input
              id="partnerLocCityManual"
              className={inputClass}
              value={city}
              disabled={!activeStateIso && !geo.alpha2}
              placeholder={
                activeStateIso
                  ? 'Enter district or city name'
                  : geo.alpha2
                    ? 'Select state first'
                    : 'Select country first'
              }
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        )}

        <div className="flex items-end sm:col-span-2">
          <button
            type="button"
            className={cn(inputClass, 'h-11 justify-center text-sm font-medium')}
            disabled={!city.trim()}
            onClick={addCurrentDistrict}
          >
            Add district / city to list
          </button>
        </div>

        <p className="text-muted-foreground text-xs sm:col-span-2">
          e.g. Dhaka, Cumilla, Noakhali — switch country and state to add districts from different
          regions.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className={btnPrimaryMd}
          disabled={pending}
          onClick={() =>
            onSave({
              preferredCountries,
              preferredDistricts,
              customExpectations: { locationFlexibility: null },
            })
          }
        >
          {pending ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </div>
  );
}
