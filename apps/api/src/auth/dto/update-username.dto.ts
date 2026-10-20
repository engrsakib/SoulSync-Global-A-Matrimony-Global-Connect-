import { IsString, Validate } from 'class-validator';
import { IsValidUsernameConstraint } from './register.dto';

export class UpdateUsernameDto {
  @IsString()
  @Validate(IsValidUsernameConstraint)
  username!: string;
}
