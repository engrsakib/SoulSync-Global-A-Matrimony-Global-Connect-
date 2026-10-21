import type {
  GeoCountryDetail,
  GeoCountrySummary,
  GeoLanguageOption,
} from '@soulsync/shared-types/geo';

type RestCountryObject = {
  names?: { common?: string };
  codes?: { alpha_2?: string };
  languages?: unknown[];
  postal_code?: { format?: string; regex?: string };
};

export function pickDefaultMotherTongue(languages: GeoLanguageOption[]): string | null {
  const first = languages.find((l) => l.name.trim().length > 0);
  return first?.name ?? null;
}

export function mapRestLanguages(raw: unknown[]): GeoLanguageOption[] {
  const options: GeoLanguageOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const record = item as Record<string, unknown>;
    const name =
      typeof record.name === 'string'
        ? record.name
        : typeof record.english_name === 'string'
          ? record.english_name
          : null;
    if (!name?.trim()) {
      continue;
    }
    const code =
      typeof record.iso639_1 === 'string'
        ? record.iso639_1
        : typeof record.iso639_3 === 'string'
          ? record.iso639_3
          : name;
    options.push({ code, name: name.trim() });
  }
  return options;
}

export function mapRestCountrySummary(obj: RestCountryObject): GeoCountrySummary | null {
  const name = obj.names?.common?.trim();
  const alpha2 = obj.codes?.alpha_2?.trim();
  if (!name || !alpha2) {
    return null;
  }
  return { name, alpha2 };
}

export function mapRestCountryDetail(obj: RestCountryObject): GeoCountryDetail | null {
  const summary = mapRestCountrySummary(obj);
  if (!summary) {
    return null;
  }
  const languages = mapRestLanguages(Array.isArray(obj.languages) ? obj.languages : []);
  const format = obj.postal_code?.format?.trim();
  const regex = obj.postal_code?.regex?.trim();
  return {
    ...summary,
    languages,
    defaultMotherTongue: pickDefaultMotherTongue(languages),
    postalFormat: format || null,
    postalRegex: regex || null,
  };
}

export type RestCountriesListResponse = {
  data?: {
    objects?: RestCountryObject[];
    meta?: { more?: boolean; offset?: number; limit?: number };
  };
  errors?: { message?: string }[];
};

export function readRestCountriesObjects(body: unknown): RestCountryObject[] {
  if (!body || typeof body !== 'object') {
    return [];
  }
  const data = (body as RestCountriesListResponse).data;
  return Array.isArray(data?.objects) ? data.objects : [];
}

export function restCountriesHasMore(body: unknown): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }
  return Boolean((body as RestCountriesListResponse).data?.meta?.more);
}

export function readRestCountriesError(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const errors = (body as RestCountriesListResponse).errors;
  const first = Array.isArray(errors) ? errors[0] : undefined;
  return typeof first?.message === 'string' ? first.message : null;
}
