import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugifyCommunityName } from './community-slug.util';

@Injectable()
export class CommunitySlugService {
  constructor(private readonly prisma: PrismaService) {}

  async allocateUniqueSlug(tenantId: string, name: string): Promise<string> {
    const base = slugifyCommunityName(name);
    let candidate = base;
    let suffix = 2;

    while (
      await this.prisma.client.community.findFirst({
        where: { tenantId, slug: candidate },
        select: { id: true },
      })
    ) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}
