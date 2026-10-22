import { Injectable } from '@nestjs/common';
import { AuditEventStatus, AuditEventType, UserActivityType } from '@soulsync/db';
import type { BiodataSectionId } from '@soulsync/shared-types/biodata';
import {
  communityPostLinkPath,
  dashboardPermissionRequestsPath,
  managedBiodataEditPath,
  memberBiodataLinkPath,
} from './activity-log.builder';
import type { ActivityLogRequestContext } from './activity-log.context';
import { ActivityLogPublisher } from './activity-log.publisher';
import type { ActivityLogWriteEntry, AuditLogWriteEntry } from './activity-log.types';
import { normalizeAuditWriteEntry, userActivityToAuditType } from './activity-log.types';

function fanoutReactionEntries(
  input: {
    tenantId: string;
    targetAuthor: UserSnippet;
    reactor: UserSnippet;
  },
  link: string,
  type: UserActivityType,
  title: string,
  body?: string,
): ActivityLogWriteEntry[] {
  const entries: ActivityLogWriteEntry[] = [];
  if (input.targetAuthor.id !== input.reactor.id) {
    entries.push({
      tenantId: input.tenantId,
      userId: input.targetAuthor.id,
      type,
      title,
      body: body ?? null,
      linkPath: link,
      actorUserId: input.reactor.id,
      relatedUserId: input.targetAuthor.id,
    });
  }
  entries.push({
    tenantId: input.tenantId,
    userId: input.reactor.id,
    type,
    title,
    body: body ?? null,
    linkPath: link,
    actorUserId: input.reactor.id,
    relatedUserId: input.targetAuthor.id,
  });
  return entries;
}

const SECTION_TITLES: Record<BiodataSectionId, string> = {
  basic: 'Basic info',
  location: 'Location',
  education_career: 'Education & career',
  faith: 'Faith',
  islam_sharia: 'Islam & sharia',
  privacy: 'Privacy',
  family_heritage: 'Family heritage',
  my_attributes: 'My attributes',
  partner: 'Partner preferences',
  partner_location: 'Partner location',
  guardian_contact: 'Guardian contact',
};

type UserSnippet = {
  id: string;
  tenantId: string;
  username: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profile?: { displayName: string | null } | null;
};

@Injectable()
export class ActivityLogRecorder {
  constructor(private readonly publisher: ActivityLogPublisher) {}

  sectionTitle(sectionId: string): string {
    return SECTION_TITLES[sectionId as BiodataSectionId] ?? sectionId;
  }

  private publish(
    audit: AuditLogWriteEntry,
    entries: ActivityLogWriteEntry[],
    ctx?: ActivityLogRequestContext,
  ): void {
    const baseAudit = normalizeAuditWriteEntry(audit);
    const auditEntry: AuditLogWriteEntry = ctx
      ? {
          ...baseAudit,
          payload: {
            ...baseAudit.payload!,
            ipAddress: ctx.ipAddress ?? baseAudit.payload!.ipAddress,
            userAgent: ctx.userAgent ?? baseAudit.payload!.userAgent,
          },
        }
      : baseAudit;
    this.publisher.record([{ audit: auditEntry, entries }]);
  }

  profileUpdated(user: UserSnippet, fieldNames?: string[]): void {
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: user.tenantId,
        userId: user.id,
        type: UserActivityType.PROFILE_UPDATED,
        title: 'Updated profile',
        body: fieldNames?.length ? fieldNames.join(', ') : 'Name or profile details changed',
        linkPath: '/dashboard/profile',
        actorUserId: user.id,
        metadata: fieldNames?.length ? { fieldNames } : null,
      },
    ];
    this.publish(
      {
        tenantId: user.tenantId,
        type: userActivityToAuditType(UserActivityType.PROFILE_UPDATED),
        actorUserId: user.id,
        linkPath: '/dashboard/profile',
      },
      entries,
    );
  }

  biodataSectionUpdatedByOwner(user: UserSnippet, sectionId: string): void {
    const section = this.sectionTitle(sectionId);
    this.publish(
      {
        tenantId: user.tenantId,
        type: userActivityToAuditType(UserActivityType.BIODATA_UPDATED),
        actorUserId: user.id,
        linkPath: '/dashboard/biodata',
        metadata: { sectionId },
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.BIODATA_UPDATED,
          title: 'Updated biodata',
          body: section,
          linkPath: '/dashboard/biodata',
          actorUserId: user.id,
          metadata: { sectionId },
        },
      ],
    );
  }

  biodataSectionUpdatedByEditor(
    owner: UserSnippet,
    editor: UserSnippet,
    sectionId: string,
  ): void {
    const section = this.sectionTitle(sectionId);
    const ownerUsername = owner.username ?? '';
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: owner.tenantId,
        userId: owner.id,
        type: UserActivityType.BIODATA_UPDATED_BY_EDITOR,
        title: 'Biodata updated by editor',
        body: section,
        linkPath: memberBiodataLinkPath(owner.username),
        actorUserId: editor.id,
        relatedUserId: owner.id,
        metadata: { sectionId },
      },
      {
        tenantId: editor.tenantId,
        userId: editor.id,
        type: UserActivityType.BIODATA_EDITED_FOR_OWNER,
        title: 'Edited biodata for owner',
        body: section,
        linkPath: managedBiodataEditPath(ownerUsername),
        actorUserId: editor.id,
        relatedUserId: owner.id,
        metadata: { sectionId },
      },
    ];
    this.publish(
      {
        tenantId: owner.tenantId,
        type: userActivityToAuditType(UserActivityType.BIODATA_UPDATED_BY_EDITOR),
        actorUserId: editor.id,
        targetUserId: owner.id,
        linkPath: memberBiodataLinkPath(owner.username),
        metadata: { sectionId },
      },
      entries,
    );
  }

  accessRequestCreated(
    requester: UserSnippet,
    owner: UserSnippet,
    sectionId: string,
    sectionTitle: string,
  ): void {
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: requester.tenantId,
        userId: requester.id,
        type: UserActivityType.BIODATA_ACCESS_REQUEST_SENT,
        title: 'Access request sent',
        linkPath: dashboardPermissionRequestsPath(),
        actorUserId: requester.id,
        relatedUserId: owner.id,
        metadata: { sectionId, sectionTitle },
      },
      {
        tenantId: owner.tenantId,
        userId: owner.id,
        type: UserActivityType.BIODATA_ACCESS_REQUEST_RECEIVED,
        title: 'Access request received',
        linkPath: dashboardPermissionRequestsPath(),
        actorUserId: requester.id,
        relatedUserId: owner.id,
        metadata: { sectionId, sectionTitle },
      },
    ];
    this.publish(
      {
        tenantId: owner.tenantId,
        type: userActivityToAuditType(UserActivityType.BIODATA_ACCESS_REQUEST_SENT),
        actorUserId: requester.id,
        targetUserId: owner.id,
        linkPath: dashboardPermissionRequestsPath(),
        metadata: { sectionId, sectionTitle },
      },
      entries,
    );
  }

  accessRequestDecided(input: {
    requester: UserSnippet;
    owner: UserSnippet;
    sectionTitle: string;
    decision: 'approve' | 'deny' | 'revoke';
  }): void {
    const { requester, owner, sectionTitle, decision } = input;
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: requester.tenantId,
        userId: requester.id,
        type: UserActivityType.BIODATA_ACCESS_REQUEST_DECIDED,
        title: 'Access request decided',
        linkPath: memberBiodataLinkPath(owner.username),
        actorUserId: owner.id,
        relatedUserId: requester.id,
        metadata: { sectionTitle, decision },
      },
      {
        tenantId: owner.tenantId,
        userId: owner.id,
        type: UserActivityType.BIODATA_ACCESS_REQUEST_DECIDED,
        title: 'Access request decided',
        linkPath: dashboardPermissionRequestsPath(),
        actorUserId: owner.id,
        relatedUserId: requester.id,
        metadata: { sectionTitle, decision },
      },
    ];
    this.publish(
      {
        tenantId: owner.tenantId,
        type: userActivityToAuditType(UserActivityType.BIODATA_ACCESS_REQUEST_DECIDED),
        actorUserId: owner.id,
        targetUserId: requester.id,
        metadata: { sectionTitle, decision },
      },
      entries,
    );
  }

  editorGrantEvent(input: {
    type: Extract<
      UserActivityType,
      'BIODATA_EDITOR_INVITE' | 'BIODATA_EDITOR_REQUEST' | 'BIODATA_EDITOR_DECIDED'
    >;
    owner: UserSnippet;
    editor: UserSnippet;
    titleForOwner: string;
    titleForEditor: string;
    body?: string;
    linkPathOwner: string;
    linkPathEditor: string;
  }): void {
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: input.owner.tenantId,
        userId: input.owner.id,
        type: input.type,
        title: input.titleForOwner,
        body: input.body ?? null,
        linkPath: input.linkPathOwner,
        actorUserId: input.editor.id,
        relatedUserId: input.owner.id,
      },
      {
        tenantId: input.editor.tenantId,
        userId: input.editor.id,
        type: input.type,
        title: input.titleForEditor,
        body: input.body ?? null,
        linkPath: input.linkPathEditor,
        actorUserId: input.owner.id,
        relatedUserId: input.editor.id,
      },
    ];
    this.publish(
      {
        tenantId: input.owner.tenantId,
        type: userActivityToAuditType(input.type),
        actorUserId: input.editor.id,
        targetUserId: input.owner.id,
        linkPath: input.linkPathOwner,
      },
      entries,
    );
  }

  communityCommentReply(input: {
    tenantId: string;
    parentAuthor: UserSnippet;
    commenter: UserSnippet;
    communitySlug: string;
    postId: string;
    commentId: string;
  }): void {
    const link = communityPostLinkPath(input.communitySlug, input.postId, input.commentId);
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: input.tenantId,
        userId: input.parentAuthor.id,
        type: UserActivityType.COMMUNITY_COMMENT_REPLY,
        title: 'Reply on comment',
        linkPath: link,
        actorUserId: input.commenter.id,
        relatedUserId: input.parentAuthor.id,
        metadata: { postId: input.postId, commentId: input.commentId },
      },
      {
        tenantId: input.tenantId,
        userId: input.commenter.id,
        type: UserActivityType.COMMUNITY_COMMENT_REPLY,
        title: 'Reply on comment',
        linkPath: link,
        actorUserId: input.commenter.id,
        relatedUserId: input.parentAuthor.id,
      },
    ];
    this.publish(
      {
        tenantId: input.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_COMMENT_REPLY),
        actorUserId: input.commenter.id,
        targetUserId: input.parentAuthor.id,
        linkPath: link,
      },
      entries,
    );
  }

  communityCommentCreated(input: {
    tenantId: string;
    postAuthor: UserSnippet;
    commenter: UserSnippet;
    communitySlug: string;
    postId: string;
    commentId: string;
  }): void {
    const link = communityPostLinkPath(input.communitySlug, input.postId, input.commentId);
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: input.tenantId,
        userId: input.postAuthor.id,
        type: UserActivityType.COMMUNITY_COMMENT_CREATED,
        title: 'Comment on post',
        linkPath: link,
        actorUserId: input.commenter.id,
        relatedUserId: input.postAuthor.id,
        metadata: { postId: input.postId, commentId: input.commentId },
      },
      {
        tenantId: input.tenantId,
        userId: input.commenter.id,
        type: UserActivityType.COMMUNITY_COMMENT_CREATED,
        title: 'Comment on post',
        linkPath: link,
        actorUserId: input.commenter.id,
        relatedUserId: input.postAuthor.id,
        metadata: { postId: input.postId, commentId: input.commentId },
      },
    ];
    this.publish(
      {
        tenantId: input.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_COMMENT_CREATED),
        actorUserId: input.commenter.id,
        targetUserId: input.postAuthor.id,
        linkPath: link,
        metadata: { postId: input.postId, commentId: input.commentId },
      },
      entries,
    );
  }

  communityReactionAdded(input: {
    tenantId: string;
    targetAuthor: UserSnippet;
    reactor: UserSnippet;
    communitySlug: string;
    postId: string;
    commentId?: string;
    kind: string;
  }): void {
    const link = communityPostLinkPath(input.communitySlug, input.postId, input.commentId);
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: input.tenantId,
        userId: input.targetAuthor.id,
        type: UserActivityType.COMMUNITY_REACTION_ADDED,
        title: 'Reaction added',
        body: input.kind,
        linkPath: link,
        actorUserId: input.reactor.id,
        relatedUserId: input.targetAuthor.id,
        metadata: input.commentId ? { commentId: input.commentId } : null,
      },
      {
        tenantId: input.tenantId,
        userId: input.reactor.id,
        type: UserActivityType.COMMUNITY_REACTION_ADDED,
        title: 'Reaction added',
        body: input.kind,
        linkPath: link,
        actorUserId: input.reactor.id,
        relatedUserId: input.targetAuthor.id,
        metadata: input.commentId ? { commentId: input.commentId } : null,
      },
    ];
    this.publish(
      {
        tenantId: input.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_REACTION_ADDED),
        actorUserId: input.reactor.id,
        targetUserId: input.targetAuthor.id,
        linkPath: link,
        metadata: { kind: input.kind, postId: input.postId, commentId: input.commentId ?? null },
      },
      entries,
    );
  }

  communityPostUpdated(author: UserSnippet, communitySlug: string, postId: string): void {
    this.publish(
      {
        tenantId: author.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_POST_UPDATED),
        actorUserId: author.id,
        linkPath: communityPostLinkPath(communitySlug, postId),
        metadata: { postId },
      },
      [
        {
          tenantId: author.tenantId,
          userId: author.id,
          type: UserActivityType.COMMUNITY_POST_UPDATED,
          title: 'Updated a community post',
          linkPath: communityPostLinkPath(communitySlug, postId),
          actorUserId: author.id,
          metadata: { postId },
        },
      ],
    );
  }

  biodataViewed(viewer: UserSnippet, owner: UserSnippet, linkPath: string): void {
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: viewer.tenantId,
        userId: viewer.id,
        type: UserActivityType.BIODATA_VIEWED,
        title: 'Biodata viewed',
        linkPath,
        actorUserId: viewer.id,
        relatedUserId: owner.id,
      },
      {
        tenantId: owner.tenantId,
        userId: owner.id,
        type: UserActivityType.BIODATA_VIEWED,
        title: 'Biodata viewed',
        linkPath: memberBiodataLinkPath(owner.username),
        actorUserId: viewer.id,
        relatedUserId: owner.id,
      },
    ];
    this.publish(
      {
        tenantId: viewer.tenantId,
        type: AuditEventType.BIODATA_VIEWED,
        actorUserId: viewer.id,
        targetUserId: owner.id,
        linkPath,
        dedupeDaily: true,
      },
      entries,
    );
  }

  biodataPrivacyUpdated(user: UserSnippet, sectionIds: string[]): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: AuditEventType.BIODATA_PRIVACY_UPDATED,
        actorUserId: user.id,
        linkPath: '/dashboard/biodata/settings',
        metadata: { sectionIds },
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.BIODATA_PRIVACY_UPDATED,
          title: 'Updated biodata privacy settings',
          linkPath: '/dashboard/biodata/settings',
          actorUserId: user.id,
          metadata: { sectionIds },
        },
      ],
    );
  }

  authLoginSuccess(user: UserSnippet, ctx?: ActivityLogRequestContext): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: AuditEventType.AUTH_LOGIN,
        status: AuditEventStatus.SUCCESS,
        actorUserId: user.id,
        linkPath: '/dashboard',
      },
      [],
      ctx,
    );
  }

  authLoginFailed(tenantId: string, ctx?: ActivityLogRequestContext): void {
    this.publish(
      {
        tenantId,
        type: AuditEventType.AUTH_LOGIN_FAILED,
        status: AuditEventStatus.FAILURE,
      },
      [],
      ctx,
    );
  }

  authRefreshSuccess(user: UserSnippet, ctx?: ActivityLogRequestContext): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: AuditEventType.AUTH_REFRESH,
        status: AuditEventStatus.SUCCESS,
        actorUserId: user.id,
      },
      [],
      ctx,
    );
  }

  authRefreshFailed(tenantId: string, ctx?: ActivityLogRequestContext): void {
    this.publish(
      {
        tenantId,
        type: AuditEventType.AUTH_REFRESH_FAILED,
        status: AuditEventStatus.FAILURE,
      },
      [],
      ctx,
    );
  }

  usernameUpdated(user: UserSnippet): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: userActivityToAuditType(UserActivityType.USERNAME_UPDATED),
        actorUserId: user.id,
        linkPath: '/dashboard/profile',
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.USERNAME_UPDATED,
          title: 'Username updated',
          linkPath: '/dashboard/profile',
          actorUserId: user.id,
        },
      ],
    );
  }

  passwordUpdated(user: UserSnippet): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: userActivityToAuditType(UserActivityType.PASSWORD_UPDATED),
        actorUserId: user.id,
        linkPath: '/dashboard/profile',
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.PASSWORD_UPDATED,
          title: 'Password updated',
          linkPath: '/dashboard/profile',
          actorUserId: user.id,
        },
      ],
    );
  }

  authRegistered(user: UserSnippet): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: AuditEventType.AUTH_REGISTER,
        status: AuditEventStatus.SUCCESS,
        actorUserId: user.id,
        linkPath: '/dashboard',
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.ACCOUNT_REGISTERED,
          title: 'Account created',
          linkPath: '/dashboard/profile',
          actorUserId: user.id,
        },
      ],
    );
  }

  authGuestCreated(user: UserSnippet): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: AuditEventType.AUTH_GUEST_CREATED,
        actorUserId: user.id,
        linkPath: '/dashboard',
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.ACCOUNT_REGISTERED,
          title: 'Guest account created',
          linkPath: '/dashboard/profile',
          actorUserId: user.id,
        },
      ],
    );
  }

  authGuestLogin(user: UserSnippet, ctx?: ActivityLogRequestContext): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: AuditEventType.AUTH_GUEST_LOGIN,
        actorUserId: user.id,
        linkPath: '/dashboard',
      },
      [],
      ctx,
    );
  }

  communityReactionChanged(input: {
    tenantId: string;
    targetAuthor: UserSnippet;
    reactor: UserSnippet;
    communitySlug: string;
    postId: string;
    commentId?: string;
    kind: string;
  }): void {
    const link = communityPostLinkPath(input.communitySlug, input.postId, input.commentId);
    this.publish(
      {
        tenantId: input.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_REACTION_CHANGED),
        actorUserId: input.reactor.id,
        targetUserId: input.targetAuthor.id,
        linkPath: link,
        metadata: { kind: input.kind },
      },
      fanoutReactionEntries(input, link, UserActivityType.COMMUNITY_REACTION_CHANGED, 'Reaction updated', input.kind),
    );
  }

  communityReactionRemoved(input: {
    tenantId: string;
    targetAuthor: UserSnippet;
    reactor: UserSnippet;
    communitySlug: string;
    postId: string;
    commentId?: string;
  }): void {
    const link = communityPostLinkPath(input.communitySlug, input.postId, input.commentId);
    this.publish(
      {
        tenantId: input.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_REACTION_REMOVED),
        actorUserId: input.reactor.id,
        targetUserId: input.targetAuthor.id,
        linkPath: link,
      },
      fanoutReactionEntries(input, link, UserActivityType.COMMUNITY_REACTION_REMOVED, 'Reaction removed'),
    );
  }

  communityJoined(user: UserSnippet, communitySlug: string, communityName: string): void {
    const link = `/dashboard/communities/${communitySlug}`;
    this.publish(
      {
        tenantId: user.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_JOINED),
        actorUserId: user.id,
        linkPath: link,
        metadata: { communitySlug, communityName },
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.COMMUNITY_JOINED,
          title: 'Joined community',
          body: communityName,
          linkPath: link,
          actorUserId: user.id,
          metadata: { communitySlug, communityName },
        },
      ],
    );
  }

  communityJoinRequested(user: UserSnippet, communitySlug: string, communityName: string): void {
    const link = `/dashboard/communities/${communitySlug}`;
    this.publish(
      {
        tenantId: user.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_JOIN_REQUESTED),
        actorUserId: user.id,
        linkPath: link,
        metadata: { communitySlug, communityName },
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.COMMUNITY_JOIN_REQUESTED,
          title: 'Requested to join community',
          body: communityName,
          linkPath: link,
          actorUserId: user.id,
        },
      ],
    );
  }

  communityJoinDecided(input: {
    requester: UserSnippet;
    moderator: UserSnippet;
    communitySlug: string;
    communityName: string;
    decision: 'approve' | 'deny';
  }): void {
    const link = `/dashboard/communities/${input.communitySlug}`;
    const entries: ActivityLogWriteEntry[] = [
      {
        tenantId: input.requester.tenantId,
        userId: input.requester.id,
        type: UserActivityType.COMMUNITY_JOIN_REQUEST_DECIDED,
        title: 'Community join request decided',
        body: input.decision,
        linkPath: link,
        actorUserId: input.moderator.id,
        relatedUserId: input.requester.id,
        metadata: { communitySlug: input.communitySlug, decision: input.decision },
      },
      {
        tenantId: input.moderator.tenantId,
        userId: input.moderator.id,
        type: UserActivityType.COMMUNITY_JOIN_REQUEST_DECIDED,
        title: 'Community join request decided',
        body: input.decision,
        linkPath: link,
        actorUserId: input.moderator.id,
        relatedUserId: input.requester.id,
      },
    ];
    this.publish(
      {
        tenantId: input.requester.tenantId,
        type: userActivityToAuditType(UserActivityType.COMMUNITY_JOIN_REQUEST_DECIDED),
        actorUserId: input.moderator.id,
        targetUserId: input.requester.id,
        linkPath: link,
        metadata: { decision: input.decision },
      },
      entries,
    );
  }

  authLogout(user: UserSnippet, ctx?: ActivityLogRequestContext): void {
    this.publish(
      {
        tenantId: user.tenantId,
        type: AuditEventType.AUTH_LOGOUT,
        actorUserId: user.id,
        linkPath: '/login',
      },
      [
        {
          tenantId: user.tenantId,
          userId: user.id,
          type: UserActivityType.SESSION_LOGOUT,
          title: 'Signed out',
          linkPath: '/login',
          actorUserId: user.id,
        },
      ],
      ctx,
    );
  }
}
