import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GeoModule } from '../geo/geo.module';
import { BiodataController } from './biodata.controller';
import { BiodataService } from './biodata.service';

@Module({
  imports: [AuthModule, GeoModule],
  controllers: [BiodataController],
  providers: [BiodataService],
  exports: [BiodataService],
})
export class BiodataModule {}
