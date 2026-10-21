export { ApiCommonErrors } from './decorators/api-common-errors.decorator';
export { ApiJsonBody } from './decorators/api-json-body.decorator';
export {
  ApiWrappedCreatedResponse,
  ApiWrappedOkArrayResponse,
  ApiWrappedOkResponse,
} from './decorators/api-wrapped-response.decorator';
export { ApiErrorEnvelopeDto } from './dto/api-error-envelope.dto';
export { ApiSuccessEnvelopeDto } from './dto/api-success-envelope.dto';
export { AuthResultResponseDto } from './dto/auth-result-response.dto';
export { MessageDataDto } from './dto/message-data.dto';
export { PublicUserResponseDto } from './dto/public-user-response.dto';
export { UsernameAvailabilityResponseDto } from './dto/username-availability-response.dto';

import { ApiErrorEnvelopeDto } from './dto/api-error-envelope.dto';
import { ApiSuccessEnvelopeDto } from './dto/api-success-envelope.dto';
import { AuthResultResponseDto } from './dto/auth-result-response.dto';
import { MessageDataDto } from './dto/message-data.dto';
import { PublicUserResponseDto } from './dto/public-user-response.dto';
import { UsernameAvailabilityResponseDto } from './dto/username-availability-response.dto';

export const SWAGGER_EXTRA_MODELS = [
  ApiSuccessEnvelopeDto,
  ApiErrorEnvelopeDto,
  AuthResultResponseDto,
  PublicUserResponseDto,
  MessageDataDto,
  UsernameAvailabilityResponseDto,
];
