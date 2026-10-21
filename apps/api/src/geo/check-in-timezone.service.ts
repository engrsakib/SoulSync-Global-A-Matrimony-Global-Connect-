import { Injectable } from '@nestjs/common';
import { RestCountriesClient } from './rest-countries.client';

@Injectable()
export class CheckInTimezoneService {
  constructor(private readonly restCountries: RestCountriesClient) {}

  /** Primary IANA zone for a country common name (first timezone from REST Countries). */
  async resolveTimeZoneForCountryName(countryName: string): Promise<string | null> {
    const name = countryName.trim();
    if (!name || name === 'Unknown') {
      return null;
    }
    const countries = await this.restCountries.listCountries(name, 20);
    const lower = name.toLowerCase();
    const match =
      countries.find((c) => c.name.toLowerCase() === lower) ??
      countries.find((c) => c.name.toLowerCase().includes(lower)) ??
      countries[0];
    if (!match) {
      return null;
    }
    const detail = await this.restCountries.getCountryByAlpha2(match.alpha2);
    const first = detail?.timezones[0]?.trim();
    return first || null;
  }
}
