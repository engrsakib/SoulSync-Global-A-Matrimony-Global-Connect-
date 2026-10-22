import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BiodataAccessRequestStatus,
  BiodataEditorGrantInitiatedBy,
  BiodataEditorGrantStatus,
  BiodataEditorScope,
  Prisma,
  UserActivityType,
  UserNotificationType,
  UserStatus,
} from '@soulsync/db';
import type {
  BiodataEditorGrantDto,
  BiodataEditorGrantEditorListDto,
  BiodataEditorGrantOwnerListDto,
  BiodataManagedProfileSummaryDto,
  DecideBiodataEditorGrantDto,
  InviteBiodataEditorDto,
  RequestBiodataEditorAccessDto,
  UpdateBiodataEditorGrantScopeDto,
} from '@soulsync/shared-types/biodata-editor-grant';
import {
  BIODATA_EDITOR_SCOPES,
  effectiveEditorGrantStatus,
  scopeLabel,
  type BiodataEditorScope as BiodataEditorScopeDto,
} from '@soulsync/shared-types/biodata-editor-grant';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { BiodataEditorAccessService } from './biodata-editor-access.service';
import { resolveEditorGrantMemberLabel } from './biodata-editor-member-label';
import { ActivityLogRecorder } from '../activity-log/activity-log.recorder';
import { dashboardPermissionRequestsPath } from '../activity-log/activity-log.builder';

const DAILY_GRANT_ACTION_LIMIT = 20;

type GrantWithUsers = Prisma.BiodataEditorGrantGetPayload<{
  include: typeof grantInclude;
}>;

@Injectable()
export class BiodataEditorGrantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: BiodataEditorAccessService,
    private readonly fieldCrypto: FieldEncryptionService,
    private readonly activityLog: ActivityLogRecorder,
  ) {}

  private grantUserSnippet(
    user: GrantWithUsers['owner'] | GrantWithUsers['editor'],
    tenantId: string,
  ) {
    return {
      id: user.id,
      tenantId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      profile: { displayName: this.displayLabel(user) },
    };
  }

  async listMineAsOwner(ownerUserId: string): Promise<BiodataEditorGrantOwnerListDto> {
    await this.ensureUser(ownerUserId);
    const rows = await this.loadGrantsForOwner(ownerUserId);

    const pendingIncoming = rows.filter(
      (row) =>
        row.status === BiodataEditorGrantStatus.PENDING &&
        row.initiatedBy === BiodataEditorGrantInitiatedBy.EDITOR,
    );
    const pendingOutgoing = rows.filter(
      (row) =>
        row.status === BiodataEditorGrantStatus.PENDING &&
        row.initiatedBy === BiodataEditorGrantInitiatedBy.OWNER,
    );
    const activeEditors = rows.filter(
      (row) => this.effectiveStatus(row) === BiodataEditorGrantStatus.APPROVED,
    );
    const history = rows.filter(
      (row) =>
        row.status === BiodataEditorGrantStatus.DENIED ||
        row.status === BiodataEditorGrantStatus.REVOKED ||
        this.effectiveStatus(row) === BiodataEditorGrantStatus.EXPIRED,
    );

    return {
      pendingIncoming: pendingIncoming.map((row) => this.toDto(row)),
      pendingOutgoing: pendingOutgoing.map((row) => this.toDto(row)),
      activeEditors: activeEditors.map((row) => this.toDto(row)),
      history: history.map((row) => this.toDto(row)),
    };
  }

  async listMineAsEditor(editorUserId: string): Promise<BiodataEditorGrantEditorListDto> {
    await this.ensureUser(editorUserId);
    const rows = await this.loadGrantsForEditor(editorUserId);

    const pendingInvites = rows.filter(
      (row) =>
        row.status === BiodataEditorGrantStatus.PENDING &&
        row.initiatedBy === BiodataEditorGrantInitiatedBy.OWNER,
    );
    const pendingOutgoing = rows.filter(
      (row) =>
        row.status === BiodataEditorGrantStatus.PENDING &&
        row.initiatedBy === BiodataEditorGrantInitiatedBy.EDITOR,
    );
    const active = rows.filter(
      (row) => this.effectiveStatus(row) === BiodataEditorGrantStatus.APPROVED,
    );
    const history = rows.filter(
      (row) =>
        row.status === BiodataEditorGrantStatus.DENIED ||
        row.status === BiodataEditorGrantStatus.REVOKED ||
        this.effectiveStatus(row) === BiodataEditorGrantStatus.EXPIRED,
    );

    const activeManaged = await this.buildManagedSummaries(active);

    return {
      pendingInvites: pendingInvites.map((row) => this.toDto(row)),
      pendingOutgoing: pendingOutgoing.map((row) => this.toDto(row)),
      activeManaged,
      history: history.map((row) => this.toDto(row)),
    };
  }

  async invite(ownerUserId: string, body: InviteBiodataEditorDto): Promise<BiodataEditorGrantDto> {
    const owner = await this.ensureUser(ownerUserId);
    await this.assertDailyLimit(ownerUserId);

    const editorUserId = await this.access.resolveOwnerUserIdByUsername(
      ownerUserId,
      body.editorUsername,
    );
    if (editorUserId === ownerUserId) {
      throw new BadRequestException('You cannot invite yourself');
    }

    const existing = await this.prisma.client.biodataEditorGrant.findUnique({
      where: { ownerUserId_editorUserId: { ownerUserId, editorUserId } },
      include: grantInclude,
    });

    if (existing && this.effectiveStatus(existing) === BiodataEditorGrantStatus.APPROVED) {
      throw new BadRequestException('This member already has edit access');
    }

    const inviteScope = this.parseScope(body.scope, 'BOTH');

    const row = await this.prisma.client.biodataEditorGrant.upsert({
      where: { ownerUserId_editorUserId: { ownerUserId, editorUserId } },
      create: {
        tenantId: owner.tenantId,
        ownerUserId,
        editorUserId,
        status: BiodataEditorGrantStatus.PENDING,
        initiatedBy: BiodataEditorGrantInitiatedBy.OWNER,
        scope: inviteScope,
        message: body.message?.trim() || null,
      },
      update: {
        status: BiodataEditorGrantStatus.PENDING,
        initiatedBy: BiodataEditorGrantInitiatedBy.OWNER,
        scope: inviteScope,
        message: body.message?.trim() || null,
        decidedAt: null,
        approvedAt: null,
        revokedAt: null,
      },
      include: grantInclude,
    });

    await this.notifyUser(
      editorUserId,
      owner.tenantId,
      UserNotificationType.BIODATA_EDITOR_INVITE,
      {
        title: 'Invitation to edit biodata',
        body: `${this.displayLabel(row.owner)} invited you to help with their biodata (${scopeLabel(inviteScope)})`,
        linkPath: '/dashboard/biodata/managed',
      },
    );

    const ownerLabel = this.displayLabel(row.owner);
    const editorLabel = this.displayLabel(row.editor);
    this.activityLog.editorGrantEvent({
      type: UserActivityType.BIODATA_EDITOR_INVITE,
      owner: this.grantUserSnippet(row.owner, row.tenantId),
      editor: this.grantUserSnippet(row.editor, row.tenantId),
      titleForOwner: `You invited ${editorLabel} to edit biodata`,
      titleForEditor: `${ownerLabel} invited you to edit biodata`,
      body: scopeLabel(inviteScope),
      linkPathOwner: dashboardPermissionRequestsPath(),
      linkPathEditor: '/dashboard/biodata/managed',
    });

    return this.toDto(row);
  }

  async requestAccess(
    editorUserId: string,
    body: RequestBiodataEditorAccessDto,
  ): Promise<BiodataEditorGrantDto> {
    await this.ensureUser(editorUserId);
    await this.assertDailyLimit(editorUserId);

    const ownerUserId = await this.access.resolveOwnerUserIdByUsername(
      editorUserId,
      body.ownerUsername,
    );
    if (ownerUserId === editorUserId) {
      throw new BadRequestException('You cannot request access to your own biodata');
    }

    const owner = await this.ensureUser(ownerUserId);

    const existing = await this.prisma.client.biodataEditorGrant.findUnique({
      where: { ownerUserId_editorUserId: { ownerUserId, editorUserId } },
      include: grantInclude,
    });

    if (existing && this.effectiveStatus(existing) === BiodataEditorGrantStatus.APPROVED) {
      throw new BadRequestException('You already have edit access');
    }

    const row = await this.prisma.client.biodataEditorGrant.upsert({
      where: { ownerUserId_editorUserId: { ownerUserId, editorUserId } },
      create: {
        tenantId: owner.tenantId,
        ownerUserId,
        editorUserId,
        status: BiodataEditorGrantStatus.PENDING,
        initiatedBy: BiodataEditorGrantInitiatedBy.EDITOR,
        message: body.message?.trim() || null,
      },
      update: {
        status: BiodataEditorGrantStatus.PENDING,
        initiatedBy: BiodataEditorGrantInitiatedBy.EDITOR,
        message: body.message?.trim() || null,
        decidedAt: null,
        approvedAt: null,
        revokedAt: null,
      },
      include: grantInclude,
    });

    await this.notifyUser(
      ownerUserId,
      owner.tenantId,
      UserNotificationType.BIODATA_EDITOR_REQUEST,
      {
        title: 'Edit access request',
        body: `${this.displayLabel(row.editor)} asked to manage your biodata`,
        linkPath: '/dashboard/biodata/permission-requests?tab=edit',
      },
    );

    const ownerLabel = this.displayLabel(row.owner);
    const editorLabel = this.displayLabel(row.editor);
    this.activityLog.editorGrantEvent({
      type: UserActivityType.BIODATA_EDITOR_REQUEST,
      owner: this.grantUserSnippet(row.owner, row.tenantId),
      editor: this.grantUserSnippet(row.editor, row.tenantId),
      titleForOwner: `${editorLabel} requested edit access`,
      titleForEditor: `You requested edit access from ${ownerLabel}`,
      linkPathOwner: `${dashboardPermissionRequestsPath()}?tab=edit`,
      linkPathEditor: dashboardPermissionRequestsPath(),
    });

    return this.toDto(row);
  }

  async updateScope(
    ownerUserId: string,
    grantId: string,
    body: UpdateBiodataEditorGrantScopeDto,
  ): Promise<BiodataEditorGrantDto> {
    const grant = await this.prisma.client.biodataEditorGrant.findUnique({
      where: { id: grantId },
      include: grantInclude,
    });
    if (!grant || grant.ownerUserId !== ownerUserId) {
      throw new NotFoundException('Edit access grant not found');
    }
    if (this.effectiveStatus(grant) !== BiodataEditorGrantStatus.APPROVED) {
      throw new BadRequestException('Only active editors can have access changed');
    }

    const nextScope = this.parseScope(body.scope);
    const updated = await this.prisma.client.biodataEditorGrant.update({
      where: { id: grantId },
      data: { scope: nextScope },
      include: grantInclude,
    });

    await this.notifyUser(
      grant.editorUserId,
      grant.tenantId,
      UserNotificationType.BIODATA_EDITOR_DECIDED,
      {
        title: 'Edit access updated',
        body: `${this.displayLabel(updated.owner)} changed your access to: ${scopeLabel(nextScope)}`,
        linkPath: '/dashboard/biodata/managed',
      },
    );

    return this.toDto(updated);
  }

  async decide(
    actorUserId: string,
    grantId: string,
    body: DecideBiodataEditorGrantDto,
  ): Promise<BiodataEditorGrantDto> {
    const grant = await this.prisma.client.biodataEditorGrant.findUnique({
      where: { id: grantId },
      include: grantInclude,
    });
    if (!grant) {
      throw new NotFoundException('Edit access request not found');
    }

    const now = new Date();

    if (body.decision === 'revoke') {
      if (grant.ownerUserId !== actorUserId) {
        throw new ForbiddenException('Only the biodata owner can revoke edit access');
      }
      if (this.effectiveStatus(grant) !== BiodataEditorGrantStatus.APPROVED) {
        throw new BadRequestException('Only active editors can be revoked');
      }
      const updated = await this.prisma.client.biodataEditorGrant.update({
        where: { id: grantId },
        data: {
          status: BiodataEditorGrantStatus.REVOKED,
          revokedAt: now,
          decidedAt: now,
        },
        include: grantInclude,
      });
      await this.notifyUser(
        grant.editorUserId,
        grant.tenantId,
        UserNotificationType.BIODATA_EDITOR_DECIDED,
        {
          title: 'Edit access revoked',
          body: `${this.displayLabel(updated.owner)} revoked your biodata edit access`,
          linkPath: '/dashboard/biodata/managed',
        },
      );
      this.recordEditorDecided(updated, {
        owner: `You revoked ${this.displayLabel(updated.editor)}'s edit access`,
        editor: `${this.displayLabel(updated.owner)} revoked your edit access`,
      });
      return this.toDto(updated);
    }

    if (grant.status !== BiodataEditorGrantStatus.PENDING) {
      throw new BadRequestException('This request has already been decided');
    }

    if (body.decision === 'deny') {
      this.assertCanDecidePending(actorUserId, grant);
      const updated = await this.prisma.client.biodataEditorGrant.update({
        where: { id: grantId },
        data: {
          status: BiodataEditorGrantStatus.DENIED,
          decidedAt: now,
        },
        include: grantInclude,
      });
      const notifyTarget =
        grant.initiatedBy === BiodataEditorGrantInitiatedBy.OWNER
          ? grant.editorUserId
          : grant.ownerUserId;
      await this.notifyUser(
        notifyTarget,
        grant.tenantId,
        UserNotificationType.BIODATA_EDITOR_DECIDED,
        {
          title: 'Edit access declined',
          body: 'Your biodata edit access request was declined',
          linkPath: '/dashboard/biodata/settings',
        },
      );
      this.recordEditorDecided(updated, {
        owner: 'Edit access request declined',
        editor: 'Your edit access request was declined',
      });
      return this.toDto(updated);
    }

    if (body.decision !== 'approve') {
      throw new BadRequestException('Invalid decision');
    }

    this.assertCanDecidePending(actorUserId, grant);

    let approvedScope: BiodataEditorScope = grant.scope;
    if (grant.initiatedBy === BiodataEditorGrantInitiatedBy.EDITOR) {
      if (grant.ownerUserId !== actorUserId) {
        throw new ForbiddenException('Only the biodata owner can approve this request');
      }
      if (body.scope === undefined) {
        throw new BadRequestException('Choose an access scope when approving this request');
      }
      approvedScope = this.parseScope(body.scope);
    }

    const updated = await this.prisma.client.biodataEditorGrant.update({
      where: { id: grantId },
      data: {
        status: BiodataEditorGrantStatus.APPROVED,
        scope: approvedScope,
        approvedAt: now,
        decidedAt: now,
      },
      include: grantInclude,
    });

    const scopeText = scopeLabel(approvedScope);
    const notifyTarget =
      grant.initiatedBy === BiodataEditorGrantInitiatedBy.OWNER
        ? grant.editorUserId
        : grant.ownerUserId;
    await this.notifyUser(
      notifyTarget,
      grant.tenantId,
      UserNotificationType.BIODATA_EDITOR_DECIDED,
      {
        title: 'Edit access approved',
        body:
          grant.initiatedBy === BiodataEditorGrantInitiatedBy.OWNER
            ? `${this.displayLabel(updated.owner)} approved your edit access (${scopeText})`
            : `${this.displayLabel(updated.owner)} approved edit access (${scopeText})`,
        linkPath: '/dashboard/biodata/managed',
      },
    );

    this.recordEditorDecided(updated, {
      owner: `Edit access approved (${scopeText})`,
      editor: `${this.displayLabel(updated.owner)} approved your edit access (${scopeText})`,
      body: scopeText,
    });

    return this.toDto(updated);
  }

  private recordEditorDecided(
    grant: GrantWithUsers,
    titles: { owner: string; editor: string; body?: string },
  ): void {
    this.activityLog.editorGrantEvent({
      type: UserActivityType.BIODATA_EDITOR_DECIDED,
      owner: this.grantUserSnippet(grant.owner, grant.tenantId),
      editor: this.grantUserSnippet(grant.editor, grant.tenantId),
      titleForOwner: titles.owner,
      titleForEditor: titles.editor,
      body: titles.body,
      linkPathOwner: `${dashboardPermissionRequestsPath()}?tab=edit`,
      linkPathEditor: '/dashboard/biodata/managed',
    });
  }

  private assertCanDecidePending(actorUserId: string, grant: GrantWithUsers): void {
    if (grant.initiatedBy === BiodataEditorGrantInitiatedBy.OWNER) {
      if (grant.editorUserId !== actorUserId) {
        throw new ForbiddenException('Only the invited editor can respond to this invite');
      }
      return;
    }
    if (grant.ownerUserId !== actorUserId) {
      throw new ForbiddenException('Only the biodata owner can approve this request');
    }
  }

  private async buildManagedSummaries(
    grants: GrantWithUsers[],
  ): Promise<BiodataManagedProfileSummaryDto[]> {
    if (grants.length === 0) {
      return [];
    }
    const ownerIds = grants.map((grant) => grant.ownerUserId);
    const [profiles, pendingViewCounts] = await Promise.all([
      this.prisma.client.profile.findMany({
        where: { userId: { in: ownerIds } },
        select: { userId: true, completenessScore: true, updatedAt: true },
      }),
      this.prisma.client.biodataAccessRequest.groupBy({
        by: ['ownerUserId'],
        where: {
          ownerUserId: { in: ownerIds },
          status: BiodataAccessRequestStatus.PENDING,
        },
        _count: { _all: true },
      }),
    ]);
    const profileByUser = new Map(profiles.map((profile) => [profile.userId, profile]));
    const pendingViewByOwner = new Map(
      pendingViewCounts.map((row) => [row.ownerUserId, row._count._all]),
    );

    return grants.map((grant) => {
      const profile = profileByUser.get(grant.ownerUserId);
      const pendingViewAccessCount = pendingViewByOwner.get(grant.ownerUserId) ?? 0;
      return {
        grantId: grant.id,
        ownerUserId: grant.ownerUserId,
        username: grant.owner.username,
        displayName: this.displayLabel(grant.owner),
        avatarUrl: grant.owner.avatarUrl,
        scope: grant.scope,
        completenessPercent: profile?.completenessScore ?? 0,
        profileUpdatedAt: profile?.updatedAt.toISOString() ?? null,
        pendingViewAccessCount: pendingViewAccessCount > 0 ? pendingViewAccessCount : undefined,
      };
    });
  }

  private async loadGrantsForOwner(ownerUserId: string): Promise<GrantWithUsers[]> {
    return this.prisma.client.biodataEditorGrant.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: 'desc' },
      include: grantInclude,
    });
  }

  private async loadGrantsForEditor(editorUserId: string): Promise<GrantWithUsers[]> {
    return this.prisma.client.biodataEditorGrant.findMany({
      where: { editorUserId },
      orderBy: { updatedAt: 'desc' },
      include: grantInclude,
    });
  }

  private effectiveStatus(row: GrantWithUsers): BiodataEditorGrantStatus {
    return effectiveEditorGrantStatus(row.status, row.expiresAt?.toISOString() ?? null);
  }

  private toDto(row: GrantWithUsers): BiodataEditorGrantDto {
    const status = this.effectiveStatus(row);
    return {
      id: row.id,
      ownerUserId: row.ownerUserId,
      editorUserId: row.editorUserId,
      status,
      initiatedBy: row.initiatedBy,
      scope: row.scope,
      message: row.message,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
      decidedAt: row.decidedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      owner: this.toUserDto(row.owner),
      editor: this.toUserDto(row.editor),
    };
  }

  private toUserDto(user: GrantWithUsers['owner']) {
    return {
      userId: user.id,
      username: user.username,
      displayName: this.displayLabel(user),
      avatarUrl: user.avatarUrl,
    };
  }

  private displayLabel(user: GrantWithUsers['owner']): string | null {
    return resolveEditorGrantMemberLabel(
      {
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        profileDisplayName: user.profile?.displayName,
      },
      (stored) => this.fieldCrypto.decryptString(stored),
    );
  }

  private async ensureUser(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true, status: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new ForbiddenException('Account is not active');
    }
    return user;
  }

  private async assertDailyLimit(userId: string): Promise<void> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await this.prisma.client.biodataEditorGrant.count({
      where: {
        OR: [{ ownerUserId: userId }, { editorUserId: userId }],
        createdAt: { gte: since },
      },
    });
    if (count >= DAILY_GRANT_ACTION_LIMIT) {
      throw new BadRequestException('Too many edit access actions today. Try again tomorrow.');
    }
  }

  private parseScope(
    scope: BiodataEditorScopeDto | undefined,
    fallback?: BiodataEditorScope,
  ): BiodataEditorScope {
    if (scope === undefined) {
      if (fallback === undefined) {
        throw new BadRequestException('Edit access scope is required');
      }
      return fallback;
    }
    if (!BIODATA_EDITOR_SCOPES.includes(scope)) {
      throw new BadRequestException('Invalid edit access scope');
    }
    return scope;
  }

  private async notifyUser(
    userId: string,
    tenantId: string,
    type: UserNotificationType,
    input: { title: string; body: string; linkPath: string },
  ): Promise<void> {
    await this.prisma.client.userNotification.create({
      data: {
        userId,
        tenantId,
        type,
        title: input.title,
        body: input.body,
        linkPath: input.linkPath,
      },
    });
  }
}

const grantInclude = {
  owner: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      profile: { select: { displayName: true } },
    },
  },
  editor: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      profile: { select: { displayName: true } },
    },
  },
} as const;
