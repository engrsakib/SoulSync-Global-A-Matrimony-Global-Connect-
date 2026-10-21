export type GeoCountrySummary = {
  name: string;
  alpha2: string;
};

export type GeoLanguageOption = {
  code: string;
  name: string;
};

export type GeoCountryDetail = {
  name: string;
  alpha2: string;
  languages: GeoLanguageOption[];
  /** IANA time zones from REST Countries (first entry used for daily check-in). */
  timezones: string[];
  defaultMotherTongue: string | null;
  postalFormat: string | null;
  postalRegex: string | null;
};

export type GeoStateOption = {
  name: string;
  isoCode: string;
};

export type GeoCityOption = {
  name: string;
};
