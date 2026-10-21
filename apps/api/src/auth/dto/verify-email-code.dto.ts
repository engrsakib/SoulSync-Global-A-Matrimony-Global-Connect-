import { Length, Matches } from 'class-validator';

export class VerifyEmailCodeDto {
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
