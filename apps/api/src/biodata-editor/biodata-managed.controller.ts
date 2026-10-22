import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  BiodataAccessRequestDto,
  BiodataAccessRequestListDto,
  BiodataVisibilityPatchDto,
  BiodataVisibilityPolicyDto,
  DecideBiodataAccessRequestDto,
} from '@soulsync/shared-types/biodata-visibility';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import type { UploadedFilePayload } from '../media/media.types';
import { BiodataGalleryService } from '../biodata/biodata-gallery.service';
import { BiodataService } from '../biodata/biodata.service';
import { BiodataVisibilityService } from '../biodata-visibility/biodata-visibility.service';
import { BiodataEditorAccessService } from './biodata-editor-access.service';
import { ActivityLogRecorder } from '../activity-log/activity-log.recorder';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('biodata')
@ApiBearerAuth()
@Controller('biodata/managed/:ownerUserId')
@UseGuards(JwtAuthGuard)
export class BiodataManagedController {
  constructor(
    private readonly access: BiodataEditorAccessService,
    private readonly biodataService: BiodataService,
    private readonly galleryService: BiodataGalleryService,
    private readonly visibilityService: BiodataVisibilityService,
    private readonly activityLog: ActivityLogRecorder,
    private readonly prisma: PrismaService,
  ) {}

  private readonly userActivitySelect = {
    id: true,
    tenantId: true,
    username: true,
    firstName: true,
    lastName: true,
    profile: { select: { displayName: true } },
  } as const;

  private async assertView(request: AuthenticatedJwtRequest, ownerUserId: string): Promise<void> {
    await this.access.assertCanViewManaged(request.userId!, ownerUserId);
  }

  private async assertContent(
    request: AuthenticatedJwtRequest,
    ownerUserId: string,
  ): Promise<void> {
    await this.access.assertCanEditContent(request.userId!, ownerUserId);
  }

  private async assertSettings(
    request: AuthenticatedJwtRequest,
    ownerUserId: string,
  ): Promise<void> {
    await this.access.assertCanEditSettings(request.userId!, ownerUserId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get biodata for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async getManagedBiodata(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
  ): Promise<BiodataMeDto> {
    await this.assertView(request, ownerUserId);
    return this.biodataService.getMine(ownerUserId);
  }

  @Patch('sections/:sectionId')
  @ApiOperation({ summary: 'Patch a biodata section for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async patchSection(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
    @Param('sectionId') sectionId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<BiodataMeDto> {
    if (sectionId === 'privacy') {
      await this.assertSettings(request, ownerUserId);
    } else {
      await this.assertContent(request, ownerUserId);
    }
    const editorUserId = request.userId!;
    const result = await this.biodataService.patchSection(
      ownerUserId,
      sectionId,
      body,
      editorUserId,
    );
    if (editorUserId !== ownerUserId) {
      const [owner, editor] = await Promise.all([
        this.prisma.client.user.findUnique({
          where: { id: ownerUserId },
          select: this.userActivitySelect,
        }),
        this.prisma.client.user.findUnique({
          where: { id: editorUserId },
          select: this.userActivitySelect,
        }),
      ]);
      if (owner && editor) {
        this.activityLog.biodataSectionUpdatedByEditor(owner, editor, sectionId);
      }
    }
    return result;
  }

  @Get('visibility')
  @ApiOperation({ summary: 'Get visibility policy for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async getVisibility(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
  ): Promise<BiodataVisibilityPolicyDto> {
    await this.assertSettings(request, ownerUserId);
    return this.visibilityService.getVisibilityPolicy(ownerUserId);
  }

  @Patch('visibility')
  @ApiOperation({ summary: 'Update visibility for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async patchVisibility(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
    @Body() body: BiodataVisibilityPatchDto,
  ): Promise<BiodataVisibilityPolicyDto> {
    await this.assertSettings(request, ownerUserId);
    return this.visibilityService.patchVisibilityPolicy(ownerUserId, body);
  }

  @Get('access-requests')
  @ApiOperation({ summary: 'List view access requests for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async listAccessRequests(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
    @Query('includeHistory') includeHistory?: string,
  ): Promise<BiodataAccessRequestListDto> {
    await this.assertSettings(request, ownerUserId);
    return this.visibilityService.listAccessRequests(ownerUserId, {
      includeHistory: includeHistory !== 'false',
    });
  }

  @Post('access-requests/:id/decide')
  @ApiOperation({ summary: 'Decide a view access request for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async decideAccessRequest(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
    @Param('id') id: string,
    @Body() body: DecideBiodataAccessRequestDto,
  ): Promise<BiodataAccessRequestDto> {
    await this.assertSettings(request, ownerUserId);
    return this.visibilityService.decideAccessRequest(ownerUserId, id, body);
  }

  @Get('gallery')
  @ApiOperation({ summary: 'List gallery photos for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async listGallery(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
  ): Promise<BiodataGalleryPhotoDto[]> {
    await this.assertContent(request, ownerUserId);
    return this.galleryService.listForUser(ownerUserId);
  }

  @Post('gallery/photos')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload gallery photo for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async uploadGalleryPhoto(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
    @UploadedFile() file: UploadedFilePayload | undefined,
  ): Promise<BiodataGalleryPhotoDto> {
    await this.assertContent(request, ownerUserId);
    const photo = await this.galleryService.uploadPhoto(ownerUserId, file!);
    await this.biodataService.refreshCompletenessAfterGalleryChange(ownerUserId);
    return photo;
  }

  @Delete('gallery/photos/:photoId')
  @ApiOperation({ summary: 'Delete gallery photo for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async deleteGalleryPhoto(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
    @Param('photoId') photoId: string,
  ): Promise<BiodataGalleryPhotoDto[]> {
    await this.assertContent(request, ownerUserId);
    const photos = await this.galleryService.deletePhoto(ownerUserId, photoId);
    await this.biodataService.refreshCompletenessAfterGalleryChange(ownerUserId);
    return photos;
  }

  @Patch('gallery/reorder')
  @ApiOperation({ summary: 'Reorder gallery for a profile you manage' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async reorderGallery(
    @Req() request: AuthenticatedJwtRequest,
    @Param('ownerUserId') ownerUserId: string,
    @Body() body: BiodataGalleryReorderDto,
  ): Promise<BiodataGalleryPhotoDto[]> {
    await this.assertContent(request, ownerUserId);
    const photos = await this.galleryService.reorderPhotos(ownerUserId, body);
    await this.biodataService.refreshCompletenessAfterGalleryChange(ownerUserId);
    return photos;
  }
}
