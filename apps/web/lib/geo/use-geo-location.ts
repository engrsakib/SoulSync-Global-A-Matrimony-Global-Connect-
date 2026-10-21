'use client';

import * as React from 'react';
import type { GeoCountryDetail, GeoCountrySummary } from '@soulsync/shared-types/geo';
import { fetchCities, fetchCountries, fetchCountryDetail, fetchStates } from '@/lib/geo/client';

type GeoLocationInit = {
  countryName: string;
  stateRegion?: string | null;
};

export function useGeoLocation({ countryName, stateRegion }: GeoLocationInit) {
  const [countries, setCountries] = React.useState<GeoCountrySummary[]>([]);
  const [countriesLoading, setCountriesLoading] = React.useState(false);
  const [alpha2, setAlpha2] = React.useState<string | null>(null);
  const [countryDetail, setCountryDetail] = React.useState<GeoCountryDetail | null>(null);
  const [states, setStates] = React.useState<{ name: string; isoCode: string }[]>([]);
  const [cities, setCities] = React.useState<{ name: string }[]>([]);
  const [statesLoading, setStatesLoading] = React.useState(false);
  const [citiesLoading, setCitiesLoading] = React.useState(false);

  const loadCountries = React.useCallback(async (q?: string) => {
    setCountriesLoading(true);
    try {
      const list = await fetchCountries(q);
      setCountries(list);
      return list;
    } finally {
      setCountriesLoading(false);
    }
  }, []);

  const resolveCountryByName = React.useCallback(
    async (name: string, list?: GeoCountrySummary[]) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return null;
      }
      const source = list ?? (await loadCountries());
      const exact = source.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      if (exact) {
        return exact;
      }
      const searched = await fetchCountries(trimmed);
      return (
        searched.find((c) => c.name.toLowerCase() === trimmed.toLowerCase()) ?? searched[0] ?? null
      );
    },
    [loadCountries],
  );

  const selectCountry = React.useCallback(
    async (nextAlpha2: string, selectedCountryName: string, preferredState?: string | null) => {
      setAlpha2(nextAlpha2);
      setStates([]);
      setCities([]);
      setStatesLoading(true);
      try {
        const [detail, stateList] = await Promise.all([
          fetchCountryDetail(nextAlpha2),
          fetchStates(nextAlpha2),
        ]);
        setCountryDetail(detail);
        setStates(stateList);
        const stateHint = preferredState?.trim();
        if (stateHint) {
          const stateMatch = stateList.find(
            (s) => s.name.toLowerCase() === stateHint.toLowerCase(),
          );
          if (stateMatch) {
            setCitiesLoading(true);
            try {
              const cityList = await fetchCities(nextAlpha2, stateMatch.isoCode);
              setCities(cityList);
            } finally {
              setCitiesLoading(false);
            }
          }
        }
        return {
          countryName: selectedCountryName,
          defaultMotherTongue: detail.defaultMotherTongue,
          languages: detail.languages,
          timezones: detail.timezones,
          postalFormat: detail.postalFormat,
          postalRegex: detail.postalRegex,
        };
      } finally {
        setStatesLoading(false);
      }
    },
    [],
  );

  const selectState = React.useCallback(
    async (stateIsoCode: string) => {
      if (!alpha2) {
        return;
      }
      setCities([]);
      setCitiesLoading(true);
      try {
        const cityList = await fetchCities(alpha2, stateIsoCode);
        setCities(cityList);
      } finally {
        setCitiesLoading(false);
      }
    },
    [alpha2],
  );

  React.useEffect(() => {
    void (async () => {
      const list = await loadCountries();
      if (!countryName.trim() || countryName === 'Unknown') {
        return;
      }
      const match = await resolveCountryByName(countryName, list);
      if (match) {
        await selectCountry(match.alpha2, match.name, stateRegion);
      }
    })();
  }, [countryName, stateRegion, loadCountries, resolveCountryByName, selectCountry]);

  return {
    countries,
    countriesLoading,
    loadCountries,
    alpha2,
    countryDetail,
    states,
    cities,
    statesLoading,
    citiesLoading,
    selectCountry,
    selectState,
    resolveCountryByName,
  };
}
