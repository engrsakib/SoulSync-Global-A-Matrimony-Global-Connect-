import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { Env } from '../config/env.schema';

@Injectable()
export class CloudinaryConfigService implements OnModuleInit {
  constructor(private readonly config: ConfigService<Env, true>) {}

  onModuleInit(): void {
    const cloudName = this.readCloudName();
    const apiKey = this.readApiKey();
    const apiSecret = this.readApiSecret();

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      return;
    }

    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (cloudinaryUrl?.startsWith('cloudinary://')) {
      cloudinary.config({ secure: true });
    }
  }

  isConfigured(): boolean {
    const cloudName = this.readCloudName();
    const apiKey = this.readApiKey();
    const apiSecret = this.readApiSecret();
    if (cloudName && apiKey && apiSecret) {
      return true;
    }
    return Boolean(process.env.CLOUDINARY_URL?.startsWith('cloudinary://'));
  }

  private readCloudName(): string | undefined {
    return this.config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
  }

  private readApiKey(): string | undefined {
    return this.config.get('CLOUDINARY_API_KEY', { infer: true });
  }

  private readApiSecret(): string | undefined {
    return this.config.get('CLOUDINARY_API_SECRET', { infer: true });
  }
}
