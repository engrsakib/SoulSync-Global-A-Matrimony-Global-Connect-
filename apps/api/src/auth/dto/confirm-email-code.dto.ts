import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Length, Matches } from 'class-validator';

export class ConfirmEmailCodeDto {
  @ApiProperty({
    description: 'Same email address the verification code was sent to.',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

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
