import { Injectable } from '@nestjs/common';
import { UserActivityType } from '@soulsync/db';
import type { BiodataSectionId } from '@soulsync/shared-types/biodata';
import {
  buildUserActivityLabel,
  communityPostLinkPath,
  dashboardPermissionRequestsPath,
  managedBiodataEditPath,
  memberBiodataLinkPath,
} from './activity-log.builder';
import { ActivityLogPublisher } from './activity-log.publisher';
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

  profileUpdated(user: UserSnippet): void {
    this.publisher.record([
      {
        tenantId: user.tenantId,
        userId: user.id,
        type: UserActivityType.PROFILE_UPDATED,
        title: 'Updated profile',
        body: 'Name or profile details changed',
        linkPath: '/dashboard/profile',
        actorUserId: user.id,
      },
    ]);
  }

  biodataSectionUpdatedByOwner(user: UserSnippet, sectionId: string): void {
    const section = this.sectionTitle(sectionId);
    this.publisher.record([
      {
        tenantId: user.tenantId,
        userId: user.id,
        type: UserActivityType.BIODATA_UPDATED,
        title: `Updated biodata: ${section}`,
        linkPath: '/dashboard/biodata',
        actorUserId: user.id,
        metadata: { sectionId },
      },
    ]);
  }

  biodataSectionUpdatedByEditor(
    owner: UserSnippet,
    editor: UserSnippet,
    sectionId: string,
  ): void {
    const section = this.sectionTitle(sectionId);
    const ownerLabel = buildUserActivityLabel(owner);
    const editorLabel = buildUserActivityLabel(editor);
    const ownerUsername = owner.username ?? '';
    this.publisher.record([
      {
        tenantId: owner.tenantId,
        userId: owner.id,
        type: UserActivityType.BIODATA_UPDATED_BY_EDITOR,
        title: `${editorLabel} updated your biodata`,
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
        title: `You updated ${ownerLabel}'s biodata`,
        body: section,
        linkPath: managedBiodataEditPath(ownerUsername),
        actorUserId: editor.id,
        relatedUserId: owner.id,
        metadata: { sectionId },
      },
    ]);
  }

  accessRequestCreated(
    requester: UserSnippet,
    owner: UserSnippet,
    sectionId: string,
    sectionTitle: string,
  ): void {
    const ownerLabel = buildUserActivityLabel(owner);
    this.publisher.record([
      {
        tenantId: requester.tenantId,
        userId: requester.id,
        type: UserActivityType.BIODATA_ACCESS_REQUEST_SENT,
        title: `Requested access to ${sectionTitle}`,
        body: `For ${ownerLabel}'s biodata`,
        linkPath: dashboardPermissionRequestsPath(),
        actorUserId: requester.id,
        relatedUserId: owner.id,
        metadata: { sectionId },
      },
      {
        tenantId: owner.tenantId,
        userId: owner.id,
        type: UserActivityType.BIODATA_ACCESS_REQUEST_RECEIVED,
        title: `${buildUserActivityLabel(requester)} requested ${sectionTitle}`,
        linkPath: dashboardPermissionRequestsPath(),
        actorUserId: requester.id,
        relatedUserId: owner.id,
        metadata: { sectionId },
      },
    ]);
  }

  accessRequestDecided(input: {
    requester: UserSnippet;
    owner: UserSnippet;
    sectionTitle: string;
    decision: 'approve' | 'deny' | 'revoke';
  }): void {
    const { requester, owner, sectionTitle, decision } = input;
    const ownerLabel = buildUserActivityLabel(owner);
    const requesterLabel = buildUserActivityLabel(requester);
    const verb =
      decision === 'approve' ? 'approved' : decision === 'deny' ? 'declined' : 'revoked';
    this.publisher.record([
      {
        tenantId: requester.tenantId,
        userId: requester.id,
        type: UserActivityType.BIODATA_ACCESS_REQUEST_DECIDED,
        title: `${ownerLabel} ${verb} your ${sectionTitle} request`,
        linkPath: memberBiodataLinkPath(owner.username),
        actorUserId: owner.id,
        relatedUserId: requester.id,
      },
      {
        tenantId: owner.tenantId,
        userId: owner.id,
        type: UserActivityType.BIODATA_ACCESS_REQUEST_DECIDED,
        title: `You ${verb} ${requesterLabel}'s ${sectionTitle} request`,
        linkPath: dashboardPermissionRequestsPath(),
        actorUserId: owner.id,
        relatedUserId: requester.id,
      },
    ]);
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
    this.publisher.record([
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
    ]);
  }

  communityCommentCreated(input: {
    tenantId: string;
    postAuthor: UserSnippet;
    commenter: UserSnippet;
    communitySlug: string;
    postId: string;
    commentId: string;
  }): void {
    const commenterLabel = buildUserActivityLabel(input.commenter);
    const authorLabel = buildUserActivityLabel(input.postAuthor);
    const link = communityPostLinkPath(input.communitySlug, input.postId, input.commentId);
    this.publisher.record([
      {
        tenantId: input.tenantId,
        userId: input.postAuthor.id,
        type: UserActivityType.COMMUNITY_COMMENT_CREATED,
        title: `${commenterLabel} commented on your post`,
        linkPath: link,
        actorUserId: input.commenter.id,
        relatedUserId: input.postAuthor.id,
        metadata: { postId: input.postId, commentId: input.commentId },
      },
      {
        tenantId: input.tenantId,
        userId: input.commenter.id,
        type: UserActivityType.COMMUNITY_COMMENT_CREATED,
        title: `You commented on ${authorLabel}'s post`,
        linkPath: link,
        actorUserId: input.commenter.id,
        relatedUserId: input.postAuthor.id,
        metadata: { postId: input.postId, commentId: input.commentId },
      },
    ]);
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
    const reactorLabel = buildUserActivityLabel(input.reactor);
    const targetLabel = buildUserActivityLabel(input.targetAuthor);
    const link = communityPostLinkPath(input.communitySlug, input.postId, input.commentId);
    this.publisher.record([
      {
        tenantId: input.tenantId,
        userId: input.targetAuthor.id,
        type: UserActivityType.COMMUNITY_REACTION_ADDED,
        title: `${reactorLabel} reacted to your ${input.commentId ? 'comment' : 'post'}`,
        body: input.kind,
        linkPath: link,
        actorUserId: input.reactor.id,
        relatedUserId: input.targetAuthor.id,
      },
      {
        tenantId: input.tenantId,
        userId: input.reactor.id,
        type: UserActivityType.COMMUNITY_REACTION_ADDED,
        title: `You reacted to ${targetLabel}'s ${input.commentId ? 'comment' : 'post'}`,
        body: input.kind,
        linkPath: link,
        actorUserId: input.reactor.id,
        relatedUserId: input.targetAuthor.id,
      },
    ]);
  }

  communityPostUpdated(author: UserSnippet, communitySlug: string, postId: string): void {
    this.publisher.record([
      {
        tenantId: author.tenantId,
        userId: author.id,
        type: UserActivityType.COMMUNITY_POST_UPDATED,
        title: 'Updated a community post',
        linkPath: communityPostLinkPath(communitySlug, postId),
        actorUserId: author.id,
        metadata: { postId },
      },
    ]);
  }
}
