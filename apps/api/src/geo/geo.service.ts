import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  GeoCityOption,
  GeoCountryDetail,
  GeoCountrySummary,
  GeoStateOption,
} from '@soulsync/shared-types/geo';
import { GeoCscService } from './geo-csc.service';
import { RestCountriesClient } from './rest-countries.client';

@Injectable()
export class GeoService {
  constructor(
    private readonly restCountries: RestCountriesClient,
    private readonly csc: GeoCscService,
  ) {}

  listCountries(query?: string, limit?: number): Promise<GeoCountrySummary[]> {
    return this.restCountries.listCountries(query, limit);
  }

  async getCountry(alpha2: string): Promise<GeoCountryDetail> {
    const detail = await this.restCountries.getCountryByAlpha2(alpha2);
    if (!detail) {
      throw new NotFoundException(`Country not found: ${alpha2}`);
    }
    return detail;
  }

  listStates(alpha2: string): GeoStateOption[] {
    return this.csc.listStates(alpha2);
  }

  listCities(alpha2: string, stateCode: string): GeoCityOption[] {
    return this.csc.listCities(alpha2, stateCode);
  }
}
