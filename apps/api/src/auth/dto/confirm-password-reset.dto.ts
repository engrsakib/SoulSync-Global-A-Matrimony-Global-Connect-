import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Validate } from 'class-validator';
import { IsStrongPasswordConstraint } from './register.dto';

export class ConfirmPasswordResetDto {
  @ApiProperty({
    description: 'Account email that was verified for password reset.',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'New password (strength rules apply).',
    minLength: 8,
    format: 'password',
  })
  @Validate(IsStrongPasswordConstraint)
  newPassword!: string;

  @ApiProperty({
    description: 'Must match `newPassword`.',
    minLength: 8,
    format: 'password',
  })
  @Validate(IsStrongPasswordConstraint)
  confirmPassword!: string;
}
