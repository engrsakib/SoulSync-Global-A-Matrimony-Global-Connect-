import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Given / first name.', example: 'Jane', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  firstName!: string;

  @ApiProperty({ description: 'Family / last name.', example: 'Doe', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  lastName!: string;
}
