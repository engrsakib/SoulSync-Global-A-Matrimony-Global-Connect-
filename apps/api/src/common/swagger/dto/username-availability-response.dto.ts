import { ApiProperty } from '@nestjs/swagger';

export class UsernameAvailabilityResponseDto {
  @ApiProperty({ example: 'jane_doe' })
  username!: string;

  @ApiProperty({ description: 'False if taken or invalid format.' })
  available!: boolean;

  @ApiProperty({ description: 'False if username fails format rules.' })
  valid!: boolean;
}
