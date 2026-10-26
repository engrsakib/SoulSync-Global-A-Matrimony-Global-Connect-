export const MESSENGER_SOCKET_NAMESPACE = '/messenger';

export const MESSENGER_REDIS = {
  userSockets: (userId: string) => `messenger:sockets:${userId}`,
  socketUser: (socketId: string) => `messenger:socket:${socketId}`,
  online: (userId: string) => `messenger:online:${userId}`,
  unread: (userId: string) => `messenger:unread:${userId}`,
  ogCache: (hash: string) => `messenger:og:${hash}`,
} as const;

export const MESSENGER_ONLINE_TTL_SECONDS = 120;
export const MESSENGER_OG_CACHE_TTL_SECONDS = 86400;
export const MESSENGER_SOCKET_TICKET_TTL = '2m';
