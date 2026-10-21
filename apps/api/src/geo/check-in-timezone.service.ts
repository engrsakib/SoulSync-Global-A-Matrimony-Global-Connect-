import { Injectable } from '@nestjs/common';
import { RestCountriesClient } from './rest-countries.client';

@Injectable()
export class CheckInTimezoneService {
  constructor(private readonly restCountries: RestCountriesClient) {}

  async resolveAlpha2ForCountryName(countryName: string): Promise<string | null> {
    const match = await this.matchCountryByName(countryName);
    return match?.alpha2 ?? null;
  }

  /** Primary IANA zone for a country common name (normalized from REST Countries). */
  async resolveTimeZoneForCountryName(countryName: string): Promise<string | null> {
    const match = await this.matchCountryByName(countryName);
    if (!match) {
      return null;
    }
    const detail = await this.restCountries.getCountryByAlpha2(match.alpha2);
    const first = detail?.timezones[0]?.trim();
    return first || null;
  }

  private async matchCountryByName(countryName: string) {
    const name = countryName.trim();
    if (!name || name === 'Unknown') {
      return null;
    }
    const countries = await this.restCountries.listCountries(name, 20);
    const lower = name.toLowerCase();
    return (
      countries.find((c) => c.name.toLowerCase() === lower) ??
      countries.find((c) => c.name.toLowerCase().includes(lower)) ??
      countries[0] ??
      null
    );
  }
}
