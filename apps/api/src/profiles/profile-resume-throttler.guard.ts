import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';

@Injectable()
export class ProfileResumeThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as AuthenticatedJwtRequest;
    const viewerId = request.userId ?? request.ip ?? 'anonymous';
    const targetUserId =
      typeof request.params === 'object' &&
      request.params !== null &&
      'userId' in request.params &&
      typeof (request.params as { userId?: string }).userId === 'string'
        ? (request.params as { userId: string }).userId
        : 'unknown';
    return Promise.resolve(`profile-resume:${viewerId}:${targetUserId}`);
  }
}
