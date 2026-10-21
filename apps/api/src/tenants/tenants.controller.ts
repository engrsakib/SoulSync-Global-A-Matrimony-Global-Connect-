import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { TenantsService } from './tenants.service';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOkResponse({
    description:
      'Wrapped in the standard API envelope (`success`, `data`, `status_code`, `request_id`, …).',
    type: TenantResponseDto,
    isArray: true,
  })
  findAll(): Promise<TenantResponseDto[]> {
    return this.tenantsService.findAllActive();
  }
}
