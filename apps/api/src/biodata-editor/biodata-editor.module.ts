import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BiodataModule } from '../biodata/biodata.module';
import { BiodataVisibilityModule } from '../biodata-visibility/biodata-visibility.module';
import { BiodataEditorAccessService } from './biodata-editor-access.service';
import { BiodataEditorController } from './biodata-editor.controller';
import { BiodataEditorGrantService } from './biodata-editor-grant.service';
import { BiodataManagedController } from './biodata-managed.controller';

@Module({
  imports: [AuthModule, BiodataModule, BiodataVisibilityModule],
  controllers: [BiodataEditorController, BiodataManagedController],
  providers: [BiodataEditorAccessService, BiodataEditorGrantService],
  exports: [BiodataEditorAccessService, BiodataEditorGrantService],
})
export class BiodataEditorModule {}
