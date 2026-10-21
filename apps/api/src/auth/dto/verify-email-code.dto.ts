import { ApiProperty } from '@nestjs/swagger';
import { Length, Matches } from 'class-validator';

export class VerifyEmailCodeDto {
  @ApiProperty({
    description: 'Six-digit code from email (expires in 5 minutes).',
    example: '123456',
    minLength: 6,
    maxLength: 6,
    pattern: '^\\d{6}$',
  })
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
