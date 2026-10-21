import { SetMetadata } from '@nestjs/common';
import { SKIP_RESPONSE_ENVELOPE_KEY } from './constants';

/** Opt out of the global success envelope for this handler or controller. */
export const SkipResponseEnvelope = () => SetMetadata(SKIP_RESPONSE_ENVELOPE_KEY, true);
