export const USER_ACTIVITY_TYPES = [
  'PROFILE_UPDATED',
  'BIODATA_UPDATED',
  'BIODATA_UPDATED_BY_EDITOR',
  'BIODATA_EDITED_FOR_OWNER',
  'BIODATA_ACCESS_REQUEST_SENT',
  'BIODATA_ACCESS_REQUEST_RECEIVED',
  'BIODATA_ACCESS_REQUEST_DECIDED',
  'BIODATA_EDITOR_INVITE',
  'BIODATA_EDITOR_REQUEST',
  'BIODATA_EDITOR_DECIDED',
  'COMMUNITY_COMMENT_CREATED',
  'COMMUNITY_COMMENT_REPLY',
  'COMMUNITY_REACTION_ADDED',
  'COMMUNITY_REACTION_REMOVED',
  'COMMUNITY_REACTION_CHANGED',
  'COMMUNITY_POST_CREATED',
  'COMMUNITY_POST_UPDATED',
  'BIODATA_VIEWED',
  'BIODATA_PAGE_VIEWED',
  'BIODATA_PRIVACY_UPDATED',
  'BIODATA_GALLERY_UPDATED',
  'ACCOUNT_REGISTERED',
  'USERNAME_UPDATED',
  'AVATAR_UPDATED',
  'PASSWORD_UPDATED',
  'ACCOUNT_SETTINGS_UPDATED',
  'SESSION_LOGOUT',
  'COMMUNITY_JOINED',
  'COMMUNITY_JOIN_REQUESTED',
  'COMMUNITY_JOIN_REQUEST_DECIDED',
  'COMMUNITY_LEFT',
  'COMMUNITY_MEMBER_REMOVED',
  'MARRIAGE_CONFIRMATION_SENT',
  'MARRIAGE_CONFIRMATION_RECEIVED',
  'MARRIAGE_CONFIRMATION_DECIDED',
  'MARRIAGE_CONFIRMED',
] as const;

export type UserActivityTypeDto = (typeof USER_ACTIVITY_TYPES)[number];

export type UserActivityLogActorDto = {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export type UserActivityLogDto = {
  id: string;
  type: UserActivityTypeDto;
  title: string;
  body: string | null;
  linkPath: string;
  actor: UserActivityLogActorDto | null;
  related: UserActivityLogActorDto | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
};

export type UserActivityLogListDto = {
  items: UserActivityLogDto[];
  nextCursor: string | null;
  viewerTimeZone: string | null;
};

export type ActivityLogListSortDto = 'newest' | 'oldest';

export type ActivityLogListQueryDto = {
  types?: UserActivityTypeDto[];
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  sort?: ActivityLogListSortDto;
  cursor?: string;
  limit?: number;
};
