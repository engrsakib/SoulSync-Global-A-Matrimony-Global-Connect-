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
  'COMMUNITY_REACTION_ADDED',
  'COMMUNITY_POST_UPDATED',
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
