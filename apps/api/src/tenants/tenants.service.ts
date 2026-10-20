import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantResponseDto } from './dto/tenant-response.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<TenantResponseDto[]> {
    return this.prisma.client.tenant.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        supportedReligions: true,
        defaultLocale: true,
        currency: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
