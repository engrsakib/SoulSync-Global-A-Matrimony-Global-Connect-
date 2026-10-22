import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@soulsync/db';
import {
  effectiveEditorGrantStatus,
  scopeAllowsContent,
  scopeAllowsSettings,
  type TenantMemberUsernameSearchDto,
} from '@soulsync/shared-types/biodata-editor-grant';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { resolveEditorGrantMemberLabel } from './biodata-editor-member-label';

@Injectable()
export class BiodataEditorAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldCrypto: FieldEncryptionService,
  ) {}

  async assertCanViewManaged(actorUserId: string, ownerUserId: string): Promise<void> {
    if (actorUserId === ownerUserId) {
      throw new ForbiddenException('Use your own biodata routes when editing yourself');
    }
    const grant = await this.findApprovedGrant(actorUserId, ownerUserId);
    if (!grant) {
      throw new ForbiddenException('You do not have permission to view this managed biodata');
    }
  }

  async assertCanEditContent(actorUserId: string, ownerUserId: string): Promise<void> {
    if (actorUserId === ownerUserId) {
      throw new ForbiddenException('Use your own biodata routes when editing yourself');
    }
    const grant = await this.findApprovedGrant(actorUserId, ownerUserId);
    if (!grant) {
      throw new ForbiddenException('You do not have permission to edit this biodata');
    }
    if (!scopeAllowsContent(grant.scope)) {
      throw new ForbiddenException(
        'Your edit access does not include biodata content. Ask the owner to grant content access.',
      );
    }
  }

  async assertCanEditSettings(actorUserId: string, ownerUserId: string): Promise<void> {
    if (actorUserId === ownerUserId) {
      throw new ForbiddenException('Use your own biodata routes when editing yourself');
    }
    const grant = await this.findApprovedGrant(actorUserId, ownerUserId);
    if (!grant) {
      throw new ForbiddenException('You do not have permission to edit this biodata');
    }
    if (!scopeAllowsSettings(grant.scope)) {
      throw new ForbiddenException(
        'Your edit access does not include privacy and settings. Ask the owner to grant settings access.',
      );
    }
  }

  async assertCanEditBiodata(actorUserId: string, ownerUserId: string): Promise<void> {
    await this.assertCanEditContent(actorUserId, ownerUserId);
    await this.assertCanEditSettings(actorUserId, ownerUserId);
  }

  async findApprovedGrant(editorUserId: string, ownerUserId: string) {
    const row = await this.prisma.client.biodataEditorGrant.findUnique({
      where: {
        ownerUserId_editorUserId: {
          ownerUserId,
          editorUserId,
        },
      },
      include: {
        owner: { select: { tenantId: true, status: true, deletedAt: true } },
        editor: { select: { tenantId: true, status: true, deletedAt: true } },
      },
    });

    if (!row) {
      return null;
    }

    const effective = effectiveEditorGrantStatus(row.status, row.expiresAt?.toISOString() ?? null);

    if (effective !== 'APPROVED') {
      return null;
    }

    if (row.owner.deletedAt || row.editor.deletedAt) {
      return null;
    }

    if (row.owner.status !== UserStatus.ACTIVE || row.editor.status !== UserStatus.ACTIVE) {
      return null;
    }

    if (row.owner.tenantId !== row.editor.tenantId) {
      return null;
    }

    return row;
  }

  async resolveOwnerUserIdByUsername(actorUserId: string, usernameRaw: string): Promise<string> {
    const actor = await this.prisma.client.user.findUnique({
      where: { id: actorUserId },
      select: { tenantId: true },
    });
    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const username = usernameRaw.trim().replace(/^@+/, '').toLowerCase();
    if (!username) {
      throw new NotFoundException('Member not found');
    }

    const user = await this.prisma.client.user.findFirst({
      where: {
        tenantId: actor.tenantId,
        username: { equals: username, mode: 'insensitive' },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Member not found');
    }

    return user.id;
  }

  async searchMembersByUsername(
    actorUserId: string,
    queryRaw: string,
  ): Promise<TenantMemberUsernameSearchDto[]> {
    const q = queryRaw.trim().replace(/^@+/, '').toLowerCase();
    if (!q) {
      return [];
    }

    const actor = await this.prisma.client.user.findUnique({
      where: { id: actorUserId },
      select: { tenantId: true },
    });
    if (!actor) {
      throw new NotFoundException('User not found');
    }

    const users = await this.prisma.client.user.findMany({
      where: {
        tenantId: actor.tenantId,
        deletedAt: null,
        status: UserStatus.ACTIVE,
        id: { not: actorUserId },
        username: { not: null, startsWith: q, mode: 'insensitive' },
      },
      take: 8,
      orderBy: { username: 'asc' },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        firstName: true,
        lastName: true,
        profile: { select: { displayName: true } },
      },
    });

    return users.map((user) => ({
      userId: user.id,
      username: user.username!,
      displayName: resolveEditorGrantMemberLabel(
        {
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          profileDisplayName: user.profile?.displayName,
        },
        (stored) => this.fieldCrypto.decryptString(stored),
      ),
      avatarUrl: user.avatarUrl ?? null,
    }));
  }
}
