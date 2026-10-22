export const USER_NOTIFICATION_TYPES = ['COMMUNITY_MENTION'] as const;
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
