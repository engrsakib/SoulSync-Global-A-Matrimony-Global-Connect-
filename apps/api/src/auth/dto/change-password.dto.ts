import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, Validate } from 'class-validator';
import { IsStrongPasswordConstraint } from './register.dto';

export class ChangePasswordDto {
  @ApiPropertyOptional({
    description: 'Required when the account already has a password.',
    example: 'OldPass1!',
    format: 'password',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  currentPassword?: string;

  @ApiProperty({
    description: 'New password (strength rules apply).',
    example: 'Str0ng!pass',
    format: 'password',
  })
  @IsString()
  @Validate(IsStrongPasswordConstraint)
  newPassword!: string;

  @ApiProperty({
    description: 'Must match `newPassword`.',
    example: 'Str0ng!pass',
    format: 'password',
  })
  @IsString()
  @MinLength(1)
  confirmPassword!: string;
}
