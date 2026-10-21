import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, MaxLength } from 'class-validator';

export class UploadAvatarFromUrlDto {
  @ApiProperty({
    description: 'HTTPS URL of a JPEG or PNG image (max 5MB after fetch).',
    example: 'https://example.com/avatars/me.jpg',
    maxLength: 2048,
  })
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  url!: string;
}
