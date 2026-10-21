import { ApiProperty } from '@nestjs/swagger';

export class MessageDataDto {
  @ApiProperty({ example: 'Verification code sent' })
  message!: string;
}
