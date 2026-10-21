import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryConfigService } from './cloudinary-config.service';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [MediaController],
  providers: [CloudinaryConfigService, MediaService],
  exports: [MediaService],
})
export class MediaModule {}
