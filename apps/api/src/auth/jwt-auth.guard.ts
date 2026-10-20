import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtTokenService } from './jwt.service';
import { UserStatus } from '@soulsync/db';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.types';

export type AuthenticatedJwtRequest = Request & { userId?: string; jwtPayload?: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedJwtRequest>();
    const authHeader = request.headers.authorization;
    const bearer =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : '';

    if (!bearer) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtTokenService.verify(bearer);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!user || user.deletedAt || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('User not found or inactive');
    }

    request.userId = user.id;
    request.jwtPayload = payload;
    return true;
  }
}
