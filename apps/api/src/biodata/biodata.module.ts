import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GeoModule } from '../geo/geo.module';
import { MediaModule } from '../media/media.module';
import { BiodataController } from './biodata.controller';
import { BiodataGalleryService } from './biodata-gallery.service';
import { BiodataService } from './biodata.service';
import { BiodataViewService } from './biodata-view.service';
import { ActivityLogModule } from '../activity-log/activity-log.module';
import { MarriageConfirmationModule } from '../marriage-confirmation/marriage-confirmation.module';

@Module({
  imports: [AuthModule, GeoModule, MediaModule, ActivityLogModule, MarriageConfirmationModule],
  controllers: [BiodataController],
  providers: [BiodataService, BiodataViewService, BiodataGalleryService],
  exports: [BiodataService, BiodataViewService, BiodataGalleryService],
})
export class BiodataModule {}
