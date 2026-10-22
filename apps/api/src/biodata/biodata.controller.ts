import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import type {
  BiodataGalleryPhotoDto,
  BiodataGalleryReorderDto,
} from '@soulsync/shared-types/biodata-gallery';
import type {
  MemberBiodataLinkPreviewDto,
  MemberBiodataViewDto,
} from '@soulsync/shared-types/biodata-view';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import type { UploadedFilePayload } from '../media/media.types';
import { BiodataGalleryService } from './biodata-gallery.service';
import { BiodataService } from './biodata.service';
import { BiodataViewService } from './biodata-view.service';

@ApiTags('biodata')
@ApiBearerAuth()
@Controller('biodata')
@UseGuards(JwtAuthGuard)
export class BiodataController {
  constructor(
    private readonly biodataService: BiodataService,
    private readonly biodataViewService: BiodataViewService,
    private readonly galleryService: BiodataGalleryService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get decrypted biodata for the authenticated user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getMine(@Req() request: AuthenticatedJwtRequest): Promise<BiodataMeDto> {
    return this.biodataService.getMine(request.userId!);
  }

  @Get('me/gallery')
  @ApiOperation({ summary: 'List biodata gallery photos for the authenticated user' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getMyGallery(@Req() request: AuthenticatedJwtRequest): Promise<BiodataGalleryPhotoDto[]> {
    return this.galleryService.listForUser(request.userId!);
  }

  @Post('me/gallery/photos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a biodata gallery photo (JPEG/PNG, max 5MB)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async uploadGalleryPhoto(
    @Req() request: AuthenticatedJwtRequest,
    @UploadedFile() file: UploadedFilePayload | undefined,
  ): Promise<BiodataGalleryPhotoDto> {
    const photo = await this.galleryService.uploadPhoto(request.userId!, file!);
    await this.biodataService.refreshCompletenessAfterGalleryChange(request.userId!);
    return photo;
  }

  @Delete('me/gallery/photos/:photoId')
  @ApiOperation({ summary: 'Remove a biodata gallery photo' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async deleteGalleryPhoto(
    @Req() request: AuthenticatedJwtRequest,
    @Param('photoId') photoId: string,
  ): Promise<BiodataGalleryPhotoDto[]> {
    const photos = await this.galleryService.deletePhoto(request.userId!, photoId);
    await this.biodataService.refreshCompletenessAfterGalleryChange(request.userId!);
    return photos;
  }

  @Patch('me/gallery/reorder')
  @ApiOperation({ summary: 'Reorder biodata gallery photos' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async reorderGallery(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: BiodataGalleryReorderDto,
  ): Promise<BiodataGalleryPhotoDto[]> {
    const photos = await this.galleryService.reorderPhotos(request.userId!, body);
    await this.biodataService.refreshCompletenessAfterGalleryChange(request.userId!);
    return photos;
  }

  @Get('members/:username/view')
  @ApiOperation({ summary: 'View another member’s biodata with section permissions' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getMemberView(
    @Req() request: AuthenticatedJwtRequest,
    @Param('username') username: string,
  ): Promise<MemberBiodataViewDto> {
    return this.biodataViewService.getMemberView(request.userId!, username);
  }

  @Get('members/:username/preview')
  @ApiOperation({ summary: 'Link-preview card for a member biodata URL' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  getMemberLinkPreview(
    @Req() request: AuthenticatedJwtRequest,
    @Param('username') username: string,
  ): Promise<MemberBiodataLinkPreviewDto> {
    return this.biodataViewService.getLinkPreview(request.userId!, username);
  }

  @Patch('me/sections/:sectionId')
  @ApiOperation({ summary: 'Update one biodata section (encrypts sensitive fields at rest)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  patchSection(
    @Req() request: AuthenticatedJwtRequest,
    @Param('sectionId') sectionId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<BiodataMeDto> {
    return this.biodataService.patchSection(request.userId!, sectionId, body);
  }
}
