import { Injectable } from '@nestjs/common';
import type { GeoCityOption, GeoStateOption } from '@soulsync/shared-types/geo';
import { City, State } from 'country-state-city';

@Injectable()
export class GeoCscService {
  listStates(countryAlpha2: string): GeoStateOption[] {
    const code = countryAlpha2.trim().toUpperCase();
    return State.getStatesOfCountry(code)
      .map((s) => ({
        name: s.name,
        isoCode: s.isoCode,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  listCities(countryAlpha2: string, stateIsoCode: string): GeoCityOption[] {
    const countryCode = countryAlpha2.trim().toUpperCase();
    const stateCode = stateIsoCode.trim();
    return City.getCitiesOfState(countryCode, stateCode)
      .map((c) => ({ name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
