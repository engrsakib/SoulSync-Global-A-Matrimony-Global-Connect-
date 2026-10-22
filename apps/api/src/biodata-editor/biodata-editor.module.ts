import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BiodataModule } from '../biodata/biodata.module';
import { BiodataVisibilityModule } from '../biodata-visibility/biodata-visibility.module';
import { BiodataEditorAccessService } from './biodata-editor-access.service';
import { BiodataEditorController } from './biodata-editor.controller';
import { BiodataEditorGrantService } from './biodata-editor-grant.service';
import { BiodataManagedController } from './biodata-managed.controller';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [AuthModule, BiodataModule, BiodataVisibilityModule, ActivityLogModule],
  controllers: [BiodataEditorController, BiodataManagedController],
  providers: [BiodataEditorAccessService, BiodataEditorGrantService],
  exports: [BiodataEditorAccessService, BiodataEditorGrantService],
})
export class BiodataEditorModule {}
