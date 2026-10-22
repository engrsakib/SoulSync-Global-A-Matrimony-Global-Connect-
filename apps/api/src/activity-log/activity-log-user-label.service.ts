import { Injectable } from '@nestjs/common';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { resolveAccessRequestRequesterName } from '../biodata-visibility/access-request-requester-name';
import { PrismaService } from '../prisma/prisma.service';

export const activityLogUserSelect = {
  id: true,
  tenantId: true,
  username: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  profile: { select: { displayName: true } },
} as const;

export type ActivityLogUserRow = {
  id: string;
  tenantId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  profile: { displayName: string | null } | null;
};

@Injectable()
export class ActivityLogUserLabelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldCrypto: FieldEncryptionService,
  ) {}

  decryptLabel(user: {
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profile?: { displayName: string | null } | null;
  }): string {
    return resolveAccessRequestRequesterName({
      profileDisplayName: user.profile?.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      decrypt: (stored) => this.fieldCrypto.decryptString(stored),
    });
  }

  toSnippet(user: ActivityLogUserRow): {
    userId: string;
    username: string | null;
    displayName: string;
    avatarUrl: string | null;
  } {
    return {
      userId: user.id,
      username: user.username,
      displayName: this.decryptLabel(user),
      avatarUrl: user.avatarUrl,
    };
  }

  async loadSnippetsByIds(userIds: string[]): Promise<Map<string, ActivityLogUserRow>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.client.user.findMany({
      where: { id: { in: userIds } },
      select: activityLogUserSelect,
    });
    return new Map(rows.map((row) => [row.id, row]));
  }
}
