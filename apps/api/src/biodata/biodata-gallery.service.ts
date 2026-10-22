import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  BIODATA_GALLERY_MAX,
  BIODATA_GALLERY_MIN,
  type BiodataGalleryPhotoDto,
  type BiodataGalleryReorderDto,
} from '@soulsync/shared-types/biodata-gallery';
import { MediaService } from '../media/media.service';
import type { UploadedFilePayload } from '../media/media.types';
import { PrismaService } from '../prisma/prisma.service';

type GalleryPhotoRow = {
  id: string;
  url: string;
  sortOrder: number;
  width: number | null;
  height: number | null;
  publicId: string | null;
};

function toGalleryPhotoDto(row: GalleryPhotoRow): BiodataGalleryPhotoDto {
  return {
    id: row.id,
    url: row.url,
    sortOrder: row.sortOrder,
    width: row.width,
    height: row.height,
  };
}

@Injectable()
export class BiodataGalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async listForProfileId(profileId: string): Promise<BiodataGalleryPhotoDto[]> {
    const rows = await this.prisma.client.biodataGalleryPhoto.findMany({
      where: { profileId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toGalleryPhotoDto);
  }

  async listForUser(userId: string): Promise<BiodataGalleryPhotoDto[]> {
    const profile = await this.requireProfile(userId);
    return this.listForProfileId(profile.id);
  }

  async uploadPhoto(userId: string, file: UploadedFilePayload): Promise<BiodataGalleryPhotoDto> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const profile = await this.requireProfile(userId);

    this.mediaService.assertImageMime(file);

    const count = await this.prisma.client.biodataGalleryPhoto.count({
      where: { profileId: profile.id },
    });
    if (count >= BIODATA_GALLERY_MAX) {
      throw new BadRequestException(`You can upload at most ${BIODATA_GALLERY_MAX} photos`);
    }

    const uploaded = await this.mediaService.uploadUserFile(
      file,
      user.tenantId,
      user.id,
      'biodata-gallery',
    );

    const created = await this.prisma.client.biodataGalleryPhoto.create({
      data: {
        profileId: profile.id,
        sortOrder: count,
        url: uploaded.url,
        publicId: uploaded.publicId,
      },
    });

    await this.touchProfileUpdated(profile.id);
    return toGalleryPhotoDto(created);
  }

  async deletePhoto(userId: string, photoId: string): Promise<BiodataGalleryPhotoDto[]> {
    const profile = await this.requireProfile(userId);
    const photo = await this.prisma.client.biodataGalleryPhoto.findFirst({
      where: { id: photoId, profileId: profile.id },
    });
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const count = await this.prisma.client.biodataGalleryPhoto.count({
      where: { profileId: profile.id },
    });
    if (count === BIODATA_GALLERY_MIN) {
      throw new BadRequestException(
        `You must keep at least ${BIODATA_GALLERY_MIN} photos in your gallery`,
      );
    }

    await this.prisma.client.biodataGalleryPhoto.delete({ where: { id: photo.id } });
    if (photo.publicId) {
      await this.mediaService.destroyPublicId(photo.publicId, 'image');
    }

    await this.reindexSortOrders(profile.id);
    await this.touchProfileUpdated(profile.id);
    return this.listForProfileId(profile.id);
  }

  async reorderPhotos(
    userId: string,
    body: BiodataGalleryReorderDto,
  ): Promise<BiodataGalleryPhotoDto[]> {
    const profile = await this.requireProfile(userId);
    const ids = body.photoIds ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('photoIds is required');
    }

    const existing = await this.prisma.client.biodataGalleryPhoto.findMany({
      where: { profileId: profile.id },
      select: { id: true },
    });
    if (existing.length !== ids.length) {
      throw new BadRequestException('photoIds must include every gallery photo exactly once');
    }
    const owned = new Set(existing.map((row) => row.id));
    for (const id of ids) {
      if (!owned.has(id)) {
        throw new BadRequestException('Invalid photo id in reorder list');
      }
    }

    await this.prisma.client.$transaction(
      ids.map((id, index) =>
        this.prisma.client.biodataGalleryPhoto.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    await this.touchProfileUpdated(profile.id);
    return this.listForProfileId(profile.id);
  }

  private async reindexSortOrders(profileId: string): Promise<void> {
    const rows = await this.prisma.client.biodataGalleryPhoto.findMany({
      where: { profileId },
      orderBy: { sortOrder: 'asc' },
    });
    await this.prisma.client.$transaction(
      rows.map((row, index) =>
        this.prisma.client.biodataGalleryPhoto.update({
          where: { id: row.id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  private async requireProfile(userId: string) {
    const profile = await this.prisma.client.profile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  private async touchProfileUpdated(profileId: string): Promise<void> {
    await this.prisma.client.profile.update({
      where: { id: profileId },
      data: { updatedAt: new Date() },
    });
  }
}
