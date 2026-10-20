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
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @Validate(IsValidUsernameConstraint)
  username!: string;

  @IsString()
  @Validate(IsStrongPasswordConstraint)
  password!: string;
}
