import { validatePassword } from '@soulsync/shared-types';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
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

export class RegisterDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(32)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Username must be lowercase letters, numbers, or underscores',
  })
  username!: string;

  @IsString()
  @Validate(IsStrongPasswordConstraint)
  password!: string;
}
