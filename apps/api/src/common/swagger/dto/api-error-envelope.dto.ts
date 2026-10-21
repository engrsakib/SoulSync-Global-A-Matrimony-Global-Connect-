import { ApiProperty } from '@nestjs/swagger';

class ApiFieldErrorDto {
  @ApiProperty({ example: 'email' })
  field!: string;

  @ApiProperty({ example: 'email must be an email' })
  message!: string;

  @ApiProperty({ required: false, nullable: true })
  code?: string | null;
}

/** Standard error envelope (snake_case wire format). */
export class ApiErrorEnvelopeDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ name: 'status_code', example: 400 })
  status_code!: number;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiProperty({ nullable: true, example: 'VALIDATION_FAILED' })
  code!: string | null;

  @ApiProperty({ type: [ApiFieldErrorDto], nullable: true })
  errors!: ApiFieldErrorDto[] | null;

  @ApiProperty({ nullable: true, example: null })
  meta!: Record<string, unknown> | null;

  @ApiProperty({ name: 'next_step', nullable: true, example: null })
  next_step!: string | null;

  @ApiProperty({ nullable: true, example: null })
  links!: Record<string, string> | null;

  @ApiProperty({ name: 'request_id' })
  request_id!: string;

  @ApiProperty()
  timestamp!: string;
}
