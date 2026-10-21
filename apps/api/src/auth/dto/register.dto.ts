import { ApiProperty } from '@nestjs/swagger';
import { validatePassword, validateUsername } from '@soulsync/shared-types';
import {
  IsEmail,
  IsString,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return validatePassword(value).valid;
  }

  defaultMessage(): string {
    return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
  }
}

@ValidatorConstraint({ name: 'IsValidUsername', async: false })
export class IsValidUsernameConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return validateUsername(value).valid;
  }

  defaultMessage(): string {
    return 'Username must be 4–16 characters, start with a letter, and use only lowercase letters, numbers, and underscores';
  }
}

export class RegisterDto {
  @ApiProperty({
    description: 'Contact email (verification optional at register).',
    example: 'user@example.com',
    maxLength: 320,
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    description:
      'Unique handle; 4–16 characters, starts with a letter, lowercase letters, numbers, underscores.',
    example: 'jane_doe',
  })
  @IsString()
  @Validate(IsValidUsernameConstraint)
  username!: string;

  @ApiProperty({
    description: 'At least 8 characters with uppercase, lowercase, number, and special character.',
    example: 'Str0ng!pass',
    format: 'password',
  })
  @IsString()
  @Validate(IsStrongPasswordConstraint)
  password!: string;
}
