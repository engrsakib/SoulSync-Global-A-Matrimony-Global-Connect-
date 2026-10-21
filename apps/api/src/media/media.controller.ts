import { Controller, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { MediaUploadResultDto } from '../common/swagger/dto/media-upload-result.dto';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';
import type { UploadedFilePayload } from './media.types';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiTags('media')
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Upload image or PDF',
    description: 'JPEG, PNG, or PDF up to 5MB. Does not update user profile.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JPEG, PNG, or PDF (max 5MB)',
        },
      },
    },
  })
  @ApiWrappedOkResponse(MediaUploadResultDto)
  @ApiCommonErrors()
  async upload(
    @Req() request: AuthenticatedJwtRequest,
    @UploadedFile() file: UploadedFilePayload | undefined,
  ) {
    this.mediaService.assertGenericMime(file!);
    return this.mediaService.uploadUserFile(
      file,
      request.jwtPayload!.tenantId,
      request.userId!,
      'uploads',
    );
  }
}
