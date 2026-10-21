import { ApiProperty } from '@nestjs/swagger';
import { IsString, Validate } from 'class-validator';
import { IsValidUsernameConstraint } from './register.dto';

export class UpdateUsernameDto {
  @ApiProperty({
    description: 'New username (must be available in your tenant).',
    example: 'jane_doe',
  })
  @IsString()
  @Validate(IsValidUsernameConstraint)
  username!: string;
}
