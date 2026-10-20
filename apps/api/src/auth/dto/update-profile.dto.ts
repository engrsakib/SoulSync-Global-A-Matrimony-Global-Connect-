import { IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @MaxLength(64)
  firstName!: string;

  @IsString()
  @MaxLength(64)
  lastName!: string;
}
