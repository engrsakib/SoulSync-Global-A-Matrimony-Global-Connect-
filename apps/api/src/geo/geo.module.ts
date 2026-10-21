import { Module } from '@nestjs/common';
import { GeoController } from './geo.controller';
import { GeoCscService } from './geo-csc.service';
import { GeoService } from './geo.service';
import { RestCountriesClient } from './rest-countries.client';

@Module({
  controllers: [GeoController],
  providers: [GeoService, RestCountriesClient, GeoCscService],
})
export class GeoModule {}
