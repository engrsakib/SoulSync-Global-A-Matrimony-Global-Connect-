import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GuestLoginDto {
  @ApiProperty({
    description: 'Guest login code returned once when the guest account was created.',
    example: 'ABCD-1234',
  })
  @IsString()
  @MinLength(1)
  loginCode!: string;
}
