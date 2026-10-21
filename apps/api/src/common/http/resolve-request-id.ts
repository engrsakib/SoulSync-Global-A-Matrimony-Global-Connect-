import type { Request } from 'express';
import { createRequestId } from '@soulsync/shared-types';
import { REQUEST_ID_HEADER } from './constants';

export function resolveRequestId(request: Request): string {
  const header = request.headers[REQUEST_ID_HEADER];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  return createRequestId(typeof fromHeader === 'string' ? fromHeader : undefined);
}
