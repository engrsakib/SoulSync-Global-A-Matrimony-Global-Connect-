import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { MESSENGER_PRIVACY_ACTIONS, MESSENGER_REACTION_EMOJI } from '@soulsync/shared-types/messenger';

export class MessengerOneTimePrekeyDtoClass {
  @ApiProperty()
  @IsInt()
  @Min(0)
  keyId!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  publicKey!: string;
}

export class PublishMessengerKeysDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  identityPublicKey!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signedPreKeyPublic!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  signedPreKeySignature!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  signedPreKeyId!: number;

  @ApiProperty({ type: [MessengerOneTimePrekeyDtoClass] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MessengerOneTimePrekeyDtoClass)
  oneTimePrekeys!: MessengerOneTimePrekeyDtoClass[];
}

export class CreateMessengerConversationDto {
  @ApiProperty()
  @IsString()
  @MaxLength(64)
  username!: string;
}

export class MessengerPrivacyDto {
  @ApiProperty()
  @IsString()
  targetUserId!: string;

  @ApiPropertyOptional({ enum: [...MESSENGER_PRIVACY_ACTIONS, null] })
  @IsOptional()
  @IsString()
  action!: (typeof MESSENGER_PRIVACY_ACTIONS)[number] | null;
}

export class SendMessengerMessageDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ciphertext!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @ApiPropertyOptional()
  @IsOptional()
  header?: Record<string, unknown>;
}

export class MessengerSocketMessagePayloadDto {
  @ApiProperty()
  @IsString()
  conversationId!: string;

  @ApiProperty()
  @IsString()
  ciphertext!: string;

  @ApiProperty()
  @IsString()
  nonce!: string;

  @ApiPropertyOptional()
  @IsOptional()
  header?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientMessageId?: string;
}

export class MessengerEditMessagePayloadDto {
  @ApiProperty()
  @IsString()
  messageId!: string;

  @ApiProperty()
  @IsString()
  ciphertext!: string;

  @ApiProperty()
  @IsString()
  nonce!: string;

  @ApiPropertyOptional()
  @IsOptional()
  header?: Record<string, unknown>;
}

export class MessengerUnsendPayloadDto {
  @ApiProperty()
  @IsString()
  messageId!: string;
}

export class MessengerReactPayloadDto {
  @ApiProperty()
  @IsString()
  messageId!: string;

  @ApiProperty({ enum: MESSENGER_REACTION_EMOJI, nullable: true })
  @IsOptional()
  @IsString()
  emoji!: string | null;
}

export class MessengerReadPayloadDto {
  @ApiProperty()
  @IsString()
  conversationId!: string;

  @ApiProperty()
  @IsString()
  lastReadMessageId!: string;
}

export class MessengerPeerIdentityReportDto {
  @ApiProperty()
  @IsString()
  peerUserId!: string;

  @ApiProperty()
  @IsString()
  identityFingerprint!: string;
}

export class LinkPreviewQueryDto {
  @ApiProperty()
  @IsUrl({ require_protocol: true })
  url!: string;
}

export class CreateMessengerScheduledMessageDto {
  @ApiProperty()
  @IsString()
  scheduledAt!: string;

  @ApiProperty()
  @IsString()
  plaintext!: string;
}

export class UpdateMessengerScheduledMessageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  plaintext?: string;
}
