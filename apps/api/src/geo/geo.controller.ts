import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  GeoCityOption,
  GeoCountryDetail,
  GeoCountrySummary,
  GeoStateOption,
} from '@soulsync/shared-types/geo';
import {
  ApiCommonErrors,
  ApiWrappedOkArrayResponse,
  ApiWrappedOkResponse,
} from '../common/swagger';
import { GeoService } from './geo.service';

@ApiTags('geo')
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get('countries')
  @ApiOperation({ summary: 'List or search countries (REST Countries proxy)' })
  @ApiWrappedOkArrayResponse(Object)
  @ApiCommonErrors()
  listCountries(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ): Promise<GeoCountrySummary[]> {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.geoService.listCountries(q, Number.isFinite(parsedLimit) ? parsedLimit : undefined);
  }

  @Get('countries/:alpha2')
  @ApiOperation({ summary: 'Country detail: languages, postal rules' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getCountry(@Param('alpha2') alpha2: string): Promise<GeoCountryDetail> {
    return this.geoService.getCountry(alpha2);
  }

  @Get('countries/:alpha2/states')
  @ApiOperation({ summary: 'States/provinces for a country' })
  @ApiWrappedOkArrayResponse(Object)
  @ApiCommonErrors()
  listStates(@Param('alpha2') alpha2: string): GeoStateOption[] {
    return this.geoService.listStates(alpha2);
  }

  @Get('countries/:alpha2/states/:stateCode/cities')
  @ApiOperation({ summary: 'Cities for a state/province' })
  @ApiWrappedOkArrayResponse(Object)
  @ApiCommonErrors()
  listCities(
    @Param('alpha2') alpha2: string,
    @Param('stateCode') stateCode: string,
  ): GeoCityOption[] {
    return this.geoService.listCities(alpha2, stateCode);
  }
}
