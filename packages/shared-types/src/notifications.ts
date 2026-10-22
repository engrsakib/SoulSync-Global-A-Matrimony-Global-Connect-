export const USER_NOTIFICATION_TYPES = [
  'COMMUNITY_MENTION',
  'BIODATA_EDITOR_INVITE',
  'BIODATA_EDITOR_REQUEST',
  'BIODATA_EDITOR_DECIDED',
] as const;
export type UserNotificationTypeDto = (typeof USER_NOTIFICATION_TYPES)[number];

export type UserNotificationDto = {
  id: string;
  type: UserNotificationTypeDto;
  title: string;
  body: string | null;
  linkPath: string;
  readAt: string | null;
  createdAt: string;
};

export type UserNotificationListDto = {
  items: UserNotificationDto[];
  nextCursor: string | null;
  unreadCount: number;
};
