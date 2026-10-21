import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestEmailDto {
  @ApiProperty({
    description: 'Email address to verify or change to.',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email!: string;
}
