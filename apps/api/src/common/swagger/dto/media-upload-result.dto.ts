import { ApiProperty } from '@nestjs/swagger';

export class MediaUploadResultDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' })
  url!: string;

  @ApiProperty({ example: 'soulsync/tenant/user/avatar/abc123' })
  publicId!: string;

  @ApiProperty({ enum: ['image', 'raw'] })
  resourceType!: 'image' | 'raw';

  @ApiProperty({ example: 102400 })
  bytes!: number;
}
