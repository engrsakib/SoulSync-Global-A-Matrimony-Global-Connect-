import { ApiProperty } from '@nestjs/swagger';

export class PublicUserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    nullable: true,
    description: 'Verified contact email; null for guest placeholder addresses.',
    example: 'user@example.com',
  })
  email!: string | null;

  @ApiProperty({ description: 'True when email is verified and not a guest placeholder.' })
  hasVerifiedEmail!: boolean;

  @ApiProperty({ nullable: true, example: 'jane_doe' })
  username!: string | null;

  @ApiProperty({ nullable: true, example: 'Jane' })
  firstName!: string | null;

  @ApiProperty({ nullable: true, example: 'Doe' })
  lastName!: string | null;

  @ApiProperty()
  isGuest!: boolean;

  @ApiProperty({ example: 'MEMBER' })
  role!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ description: 'Whether the account has a password credential.' })
  hasPassword!: boolean;
}
