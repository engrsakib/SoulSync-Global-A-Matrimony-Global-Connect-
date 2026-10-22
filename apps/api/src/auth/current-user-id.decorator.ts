import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { AuthenticatedJwtRequest } from './jwt-auth.guard';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedJwtRequest>();
    if (!request.userId) {
      throw new Error('JwtAuthGuard must run before CurrentUserId');
    }
    return request.userId;
  },
);
