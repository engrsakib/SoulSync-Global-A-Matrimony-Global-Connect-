import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh JWT from login or prior refresh.' })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
