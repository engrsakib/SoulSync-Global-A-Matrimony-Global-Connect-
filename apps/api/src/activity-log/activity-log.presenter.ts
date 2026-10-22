import type { UserActivityType } from '@soulsync/db';

export type PresentMemberRowInput = {
  feedUserId: string;
  type: UserActivityType;
  storedTitle: string;
  storedBody: string | null;
  actorUserId: string | null;
  relatedUserId: string | null;
  metadata: Record<string, unknown> | null;
  actorLabel: string | null;
  relatedLabel: string | null;
};

const SECTION_TITLES: Record<string, string> = {
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

function sectionTitle(metadata: Record<string, unknown> | null): string | null {
  const sectionId = metadata?.sectionId;
  if (typeof sectionId !== 'string') {
    return null;
  }
  return SECTION_TITLES[sectionId] ?? sectionId;
}

function looksEncrypted(text: string): boolean {
  return text.includes('enc:v1:');
}

function fallbackTitle(storedTitle: string): string {
  if (!storedTitle || looksEncrypted(storedTitle)) {
    return 'Activity';
  }
  return storedTitle;
}

function labelOrMember(label: string | null): string {
  return label?.trim() || 'Member';
}

export function presentMemberActivityRow(input: PresentMemberRowInput): {
  title: string;
  body: string | null;
} {
  const actor = labelOrMember(input.actorLabel);
  const related = labelOrMember(input.relatedLabel);
  const section = sectionTitle(input.metadata);
  const isComment = Boolean(input.metadata?.commentId);
  const storedBody = input.storedBody;

  switch (input.type) {
    case 'PROFILE_UPDATED':
      return { title: 'Updated profile', body: storedBody ?? 'Name or profile details changed' };
    case 'BIODATA_UPDATED':
      return {
        title: section ? `Updated biodata: ${section}` : 'Updated biodata',
        body: storedBody,
      };
    case 'BIODATA_UPDATED_BY_EDITOR':
      return input.feedUserId === input.relatedUserId
        ? { title: `${actor} updated your biodata`, body: section ?? storedBody }
        : { title: `You updated ${related}'s biodata`, body: section ?? storedBody };
    case 'BIODATA_EDITED_FOR_OWNER':
      return input.feedUserId === input.actorUserId
        ? { title: `You updated ${related}'s biodata`, body: section ?? storedBody }
        : { title: `${actor} updated your biodata`, body: section ?? storedBody };
    case 'BIODATA_ACCESS_REQUEST_SENT': {
      const sectionTitle = typeof input.metadata?.sectionTitle === 'string'
        ? input.metadata.sectionTitle
        : section;
      return {
        title: sectionTitle ? `Requested access to ${sectionTitle}` : 'Requested biodata access',
        body: storedBody ?? `For ${related}'s biodata`,
      };
    }
    case 'BIODATA_ACCESS_REQUEST_RECEIVED': {
      const sectionTitle = typeof input.metadata?.sectionTitle === 'string'
        ? input.metadata.sectionTitle
        : section;
      return {
        title: sectionTitle
          ? `${actor} requested ${sectionTitle}`
          : `${actor} requested biodata access`,
        body: storedBody,
      };
    }
    case 'BIODATA_ACCESS_REQUEST_DECIDED': {
      const decision = input.metadata?.decision;
      const verb =
        decision === 'approve' ? 'approved' : decision === 'deny' ? 'declined' : 'revoked';
      const sectionTitle = typeof input.metadata?.sectionTitle === 'string'
        ? input.metadata.sectionTitle
        : 'biodata';
      if (input.feedUserId === input.actorUserId) {
        return {
          title: `You ${verb} ${related}'s ${sectionTitle} request`,
          body: storedBody,
        };
      }
      return {
        title: `${actor} ${verb} your ${sectionTitle} request`,
        body: storedBody,
      };
    }
    case 'BIODATA_EDITOR_INVITE':
    case 'BIODATA_EDITOR_REQUEST':
    case 'BIODATA_EDITOR_DECIDED':
      if (!looksEncrypted(input.storedTitle)) {
        return { title: input.storedTitle, body: storedBody };
      }
      if (input.feedUserId === input.relatedUserId) {
        return presentEditorGrantOwnerTitle(input.type, actor, related, storedBody);
      }
      return presentEditorGrantEditorTitle(input.type, actor, related, storedBody);
    case 'MARRIAGE_CONFIRMATION_SENT':
    case 'MARRIAGE_CONFIRMATION_RECEIVED':
    case 'MARRIAGE_CONFIRMATION_DECIDED':
    case 'MARRIAGE_CONFIRMED':
      if (!looksEncrypted(input.storedTitle)) {
        return { title: input.storedTitle, body: storedBody };
      }
      return { title: fallbackTitle(input.storedTitle), body: storedBody };
    case 'COMMUNITY_COMMENT_CREATED':
      return input.feedUserId === input.relatedUserId
        ? { title: `${actor} commented on your post`, body: storedBody }
        : { title: `You commented on ${related}'s post`, body: storedBody };
    case 'COMMUNITY_REACTION_ADDED': {
      const target = isComment ? 'comment' : 'post';
      return input.feedUserId === input.relatedUserId
        ? { title: `${actor} reacted to your ${target}`, body: storedBody }
        : { title: `You reacted to ${related}'s ${target}`, body: storedBody };
    }
    case 'COMMUNITY_POST_UPDATED':
      return { title: 'Updated a community post', body: storedBody };
    case 'BIODATA_VIEWED':
      return input.feedUserId === input.actorUserId
        ? { title: `You viewed ${related}'s biodata`, body: storedBody }
        : { title: `${actor} viewed your biodata`, body: storedBody };
    case 'BIODATA_PRIVACY_UPDATED':
      return { title: 'Updated biodata privacy settings', body: storedBody };
    default:
      return { title: fallbackTitle(input.storedTitle), body: storedBody };
  }
}

function presentEditorGrantOwnerTitle(
  type: UserActivityType,
  editorLabel: string,
  _ownerLabel: string,
  body: string | null,
): { title: string; body: string | null } {
  switch (type) {
    case 'BIODATA_EDITOR_INVITE':
      return { title: `You invited ${editorLabel} to edit biodata`, body };
    case 'BIODATA_EDITOR_REQUEST':
      return { title: `${editorLabel} requested edit access`, body };
    case 'BIODATA_EDITOR_DECIDED':
      return { title: body ? `Edit access approved (${body})` : 'Edit access updated', body };
    default:
      return { title: 'Edit access updated', body };
  }
}

function presentEditorGrantEditorTitle(
  type: UserActivityType,
  ownerLabel: string,
  _editorLabel: string,
  body: string | null,
): { title: string; body: string | null } {
  switch (type) {
    case 'BIODATA_EDITOR_INVITE':
      return { title: `${ownerLabel} invited you to edit biodata`, body };
    case 'BIODATA_EDITOR_REQUEST':
      return { title: `You requested edit access from ${ownerLabel}`, body };
    case 'BIODATA_EDITOR_DECIDED':
      return {
        title: body
          ? `${ownerLabel} approved your edit access (${body})`
          : 'Edit access request updated',
        body,
      };
    default:
      return { title: 'Edit access updated', body };
  }
}

export function presentAuditEventTitle(input: {
  type: string;
  actorLabel: string | null;
  targetLabel: string | null;
  metadata: Record<string, unknown> | null;
}): string {
  const actor = labelOrMember(input.actorLabel);
  const target = labelOrMember(input.targetLabel);
  switch (input.type) {
    case 'AUTH_LOGIN':
      return `${actor} logged in`;
    case 'AUTH_LOGIN_FAILED':
      return 'Failed login attempt';
    case 'AUTH_REFRESH':
      return `${actor} refreshed session`;
    case 'AUTH_REFRESH_FAILED':
      return 'Failed session refresh';
    case 'BIODATA_VIEWED':
      return `${actor} viewed ${target}'s biodata`;
    case 'BIODATA_PRIVACY_UPDATED':
      return `${actor} updated biodata privacy`;
    default:
      return presentMemberActivityRow({
        feedUserId: input.metadata?.feedUserId as string ?? '',
        type: input.type as UserActivityType,
        storedTitle: '',
        storedBody: null,
        actorUserId: null,
        relatedUserId: null,
        metadata: input.metadata,
        actorLabel: input.actorLabel,
        relatedLabel: input.targetLabel,
      }).title;
  }
}
