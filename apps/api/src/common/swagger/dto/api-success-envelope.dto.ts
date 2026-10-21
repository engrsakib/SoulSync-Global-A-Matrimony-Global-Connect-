import { ApiProperty } from '@nestjs/swagger';

/** Standard success envelope (snake_case wire format for `/v1/*`). */
export class ApiSuccessEnvelopeDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ name: 'status_code', example: 200 })
  status_code!: number;

  @ApiProperty({ example: 'Success' })
  message!: string;

  @ApiProperty({ description: 'Route-specific payload', nullable: true })
  data!: unknown;

  @ApiProperty({ nullable: true, example: null })
  meta!: Record<string, unknown> | null;

  @ApiProperty({ name: 'next_step', nullable: true, example: null })
  next_step!: string | null;

  @ApiProperty({ nullable: true, example: null })
  links!: Record<string, string> | null;

  @ApiProperty({ name: 'request_id', example: '550e8400-e29b-41d4-a716-446655440000' })
  request_id!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  timestamp!: string;
}
