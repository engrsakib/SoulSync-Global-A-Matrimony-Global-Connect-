import { IsString, MinLength } from 'class-validator';

export class GuestLoginDto {
  @IsString()
  @MinLength(1)
  loginCode!: string;
}
