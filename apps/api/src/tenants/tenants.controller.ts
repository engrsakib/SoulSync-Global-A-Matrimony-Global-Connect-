import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors, ApiWrappedOkArrayResponse } from '../common/swagger';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'List active tenants' })
  @ApiWrappedOkArrayResponse(TenantResponseDto)
  @ApiCommonErrors()
  findAll(): Promise<TenantResponseDto[]> {
    return this.tenantsService.findAllActive();
  }
}
