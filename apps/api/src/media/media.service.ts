import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import {
  ALLOWED_GENERIC_MIMES,
  ALLOWED_IMAGE_MIMES,
  MAX_UPLOAD_BYTES,
  type AllowedGenericMime,
  type AllowedImageMime,
} from './media.constants';
import { CloudinaryConfigService } from './cloudinary-config.service';
import type { UploadedFilePayload, UploadResult } from './media.types';

@Injectable()
export class MediaService {
  constructor(private readonly cloudinaryConfig: CloudinaryConfigService) {}

  assertFileSize(file: UploadedFilePayload | undefined): void {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File must be 5MB or smaller');
    }
  }

  assertImageMime(
    file: UploadedFilePayload,
  ): asserts file is UploadedFilePayload & { mimetype: AllowedImageMime } {
    this.assertFileSize(file);
    if (!(ALLOWED_IMAGE_MIMES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG and PNG images');
    }
  }

  assertGenericMime(
    file: UploadedFilePayload,
  ): asserts file is UploadedFilePayload & { mimetype: AllowedGenericMime } {
    this.assertFileSize(file);
    if (!(ALLOWED_GENERIC_MIMES as readonly string[]).includes(file.mimetype)) {
      throw new BadRequestException('Allowed types: JPEG, PNG, or PDF');
    }
  }

  userFolder(tenantId: string, userId: string): string {
    return `soulsync/${tenantId}/${userId}`;
  }

  async uploadUserFile(
    file: UploadedFilePayload,
    tenantId: string,
    userId: string,
    subfolder: string,
  ): Promise<UploadResult> {
    if (!this.cloudinaryConfig.isConfigured()) {
      throw new ServiceUnavailableException(
        'Media uploads are not configured (missing Cloudinary credentials)',
      );
    }

    const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';
    const folder = `${this.userFolder(tenantId, userId)}/${subfolder}`;

    const result = await this.uploadBuffer(file.buffer, {
      folder,
      resource_type: resourceType,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType,
      bytes: result.bytes,
    };
  }

  assertSafeRemoteUrl(rawUrl: string): void {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new BadRequestException('Invalid URL');
    }
    if (parsed.protocol !== 'https:') {
      throw new BadRequestException('URL must use HTTPS');
    }

    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.endsWith('.local')
    ) {
      throw new BadRequestException('URL host not allowed');
    }
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(host)) {
      throw new BadRequestException('URL host not allowed');
    }
  }

  async uploadFromRemoteUrl(
    remoteUrl: string,
    tenantId: string,
    userId: string,
    subfolder: string,
  ): Promise<UploadResult> {
    if (!this.cloudinaryConfig.isConfigured()) {
      throw new ServiceUnavailableException(
        'Media uploads are not configured (missing Cloudinary credentials)',
      );
    }

    this.assertSafeRemoteUrl(remoteUrl);
    const folder = `${this.userFolder(tenantId, userId)}/${subfolder}`;

    try {
      const result = await cloudinary.uploader.upload(remoteUrl, {
        folder,
        resource_type: 'image',
      });

      if (result.bytes > MAX_UPLOAD_BYTES) {
        await this.destroyPublicId(result.public_id, 'image');
        throw new BadRequestException('Remote image must be 5MB or smaller');
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: 'image',
        bytes: result.bytes,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new BadRequestException('Could not import image from URL');
    }
  }

  async destroyPublicId(publicId: string, resourceType: 'image' | 'raw'): Promise<void> {
    if (!this.cloudinaryConfig.isConfigured() || !publicId) {
      return;
    }
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch {
      // Best-effort cleanup; ignore Cloudinary errors
    }
  }

  private uploadBuffer(
    buffer: Buffer,
    options: { folder: string; resource_type: 'image' | 'raw' },
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          const message = error instanceof Error ? error.message : 'Cloudinary upload failed';
          reject(new Error(message));
          return;
        }
        if (!result) {
          reject(new Error('Empty Cloudinary upload response'));
          return;
        }
        resolve(result);
      });
      stream.end(buffer);
    });
  }
}
