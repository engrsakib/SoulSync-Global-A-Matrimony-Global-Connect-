import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address or username.',
    example: 'jane_doe',
  })
  @IsString()
  @MinLength(1)
  identifier!: string;

  @ApiProperty({
    description: 'Account password.',
    example: 'Str0ng!pass',
    format: 'password',
  })
  @IsString()
  @MinLength(1)
  password!: string;
}
