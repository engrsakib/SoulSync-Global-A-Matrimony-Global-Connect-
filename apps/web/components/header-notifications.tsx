'use client';

import { NotificationsTrigger } from '@/components/notifications/notifications-trigger';

type HeaderNotificationsProps = {
  overHero?: boolean;
};

/** Bell trigger for site header; requires `NotificationsProvider` ancestor. */
export function HeaderNotifications({ overHero }: HeaderNotificationsProps) {
  return <NotificationsTrigger variant="header" overHero={overHero} />;
}
