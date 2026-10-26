import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { SystemPageDto, SystemPageIndexItemDto } from '@soulsync/shared-types';
import {
  ApiCommonErrors,
  ApiWrappedOkArrayResponse,
  ApiWrappedOkResponse,
} from '../common/swagger';
import { SystemPagesService } from './system-pages.service';

@ApiTags('public')
@Controller('public/system-pages')
export class SystemPagesController {
  constructor(private readonly systemPages: SystemPagesService) {}

  @Get()
  @ApiOperation({ summary: 'List public system policy pages (ordered)' })
  @ApiWrappedOkArrayResponse(Object)
  @ApiCommonErrors()
  list(): Promise<SystemPageIndexItemDto[]> {
    return this.systemPages.listIndex();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a public system policy page by slug' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getBySlug(@Param('slug') slug: string): Promise<SystemPageDto> {
    return this.systemPages.getBySlug(slug);
  }
}
