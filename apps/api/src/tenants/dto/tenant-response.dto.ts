import { ApiProperty } from '@nestjs/swagger';
import { Religion } from '@soulsync/db';

export class TenantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: Religion, isArray: true })
  supportedReligions!: Religion[];

  @ApiProperty()
  defaultLocale!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
