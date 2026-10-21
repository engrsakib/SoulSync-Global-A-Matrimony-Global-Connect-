import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CommunityPostShareDto } from '@soulsync/shared-types/communities';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { CommunityPostsService } from './community-posts.service';

@ApiTags('communities')
@Controller('community-posts')
export class CommunityPostShareController {
  constructor(private readonly postsService: CommunityPostsService) {}

  @Get('share/:shareToken')
  @ApiOperation({ summary: 'Public share metadata for a published post in a public community' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getShare(@Param('shareToken') shareToken: string): Promise<CommunityPostShareDto> {
    return this.postsService.getPublicShare(shareToken);
  }
}
