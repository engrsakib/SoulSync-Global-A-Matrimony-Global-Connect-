import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PlatformBiodataStatsDto } from '@soulsync/shared-types/platform-stats';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('biodata')
  @ApiOperation({ summary: 'Public biodata counts for discoverable profiles across active tenants' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getBiodataOverview(): Promise<PlatformBiodataStatsDto> {
    return this.statsService.getBiodataOverview();
  }
}
