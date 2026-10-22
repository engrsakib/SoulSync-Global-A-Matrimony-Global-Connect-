import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicUserResponseDto } from './public-user-response.dto';

export class AuthResultResponseDto {
  @ApiProperty({ description: 'JWT access token for Bearer auth.' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token for obtaining a new access token.' })
  refreshToken!: string;

  @ApiProperty({ type: PublicUserResponseDto })
  user!: PublicUserResponseDto;

  @ApiPropertyOptional({
    description: 'Plain guest login code (only returned when creating a guest account).',
    example: 'ABCD-1234',
  })
  loginCodePlain?: string;
}
