import type {
  GeoCityOption,
  GeoCountryDetail,
  GeoCountrySummary,
  GeoStateOption,
} from '@soulsync/shared-types/geo';

async function geoFetch<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-store' });
  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
        ? body.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export function fetchCountries(q?: string): Promise<GeoCountrySummary[]> {
  const params = new URLSearchParams();
  if (q?.trim()) {
    params.set('q', q.trim());
  }
  const query = params.toString();
  return geoFetch(`/api/geo/countries${query ? `?${query}` : ''}`);
}

export function fetchCountryDetail(alpha2: string): Promise<GeoCountryDetail> {
  return geoFetch(`/api/geo/countries/${encodeURIComponent(alpha2)}`);
}

export function fetchStates(alpha2: string): Promise<GeoStateOption[]> {
  return geoFetch(`/api/geo/countries/${encodeURIComponent(alpha2)}/states`);
}

export function fetchCities(alpha2: string, stateCode: string): Promise<GeoCityOption[]> {
  return geoFetch(
    `/api/geo/countries/${encodeURIComponent(alpha2)}/states/${encodeURIComponent(stateCode)}/cities`,
  );
}
