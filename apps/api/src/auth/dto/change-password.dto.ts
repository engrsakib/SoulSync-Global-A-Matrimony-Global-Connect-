import { IsOptional, IsString, MinLength, Validate } from 'class-validator';
import { IsStrongPasswordConstraint } from './register.dto';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  currentPassword?: string;

  @IsString()
  @Validate(IsStrongPasswordConstraint)
  newPassword!: string;

  @IsString()
  @MinLength(1)
  confirmPassword!: string;
}
