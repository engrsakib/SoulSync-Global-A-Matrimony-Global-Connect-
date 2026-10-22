import type { GeoStateOption } from './geo';

/** Case-insensitive key; keeps District vs Division distinct. */
export function geoStateOptionKey(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Districts missing from `country-state-city` for BD (verified against CSC v3.2.1).
 * Naming follows CSC `"<Name> District"` convention.
 */
export const BANGLADESH_DISTRICT_SUPPLEMENTS: GeoStateOption[] = [
  { name: 'Magura District', isoCode: 'BD-Magura' },
  { name: 'Manikganj District', isoCode: 'BD-Manikganj' },
  { name: 'Narsingdi District', isoCode: 'BD-Narsingdi' },
];

export const GEO_STATE_OVERRIDES_BY_COUNTRY: Partial<Record<string, GeoStateOption[]>> = {
  BD: BANGLADESH_DISTRICT_SUPPLEMENTS,
};

export function mergeStateOptions(
  cscStates: GeoStateOption[],
  additions: GeoStateOption[],
): GeoStateOption[] {
  const merged = new Map<string, GeoStateOption>();
  for (const state of cscStates) {
    merged.set(geoStateOptionKey(state.name), state);
  }
  for (const add of additions) {
    const key = geoStateOptionKey(add.name);
    if (!merged.has(key)) {
      merged.set(key, add);
    }
  }
  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function listStatesWithOverrides(
  countryAlpha2: string,
  cscStates: GeoStateOption[],
): GeoStateOption[] {
  const code = countryAlpha2.trim().toUpperCase();
  const additions = GEO_STATE_OVERRIDES_BY_COUNTRY[code] ?? [];
  if (additions.length === 0) {
    return cscStates;
  }
  return mergeStateOptions(cscStates, additions);
}
