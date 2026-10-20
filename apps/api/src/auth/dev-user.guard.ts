import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@soulsync/db';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

export const DEV_USER_ID_HEADER = 'x-user-id';

export type AuthenticatedRequest = Request & { userId?: string };

@Injectable()
export class DevUserGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const raw = request.headers[DEV_USER_ID_HEADER];
    const userId = typeof raw === 'string' ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : '';

    if (!userId) {
      throw new UnauthorizedException(`Missing ${DEV_USER_ID_HEADER} header`);
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('User not found or inactive');
    }

    request.userId = user.id;
    return true;
  }
}
