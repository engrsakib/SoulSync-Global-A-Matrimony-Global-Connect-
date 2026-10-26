'use client';

import { io, type Socket } from 'socket.io-client';
import { fetchMessengerSocketTicket } from './messenger-api';
import { resolveMessengerApiOrigin } from './resolve-api-origin';

let socket: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;

export async function getMessengerSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }
  if (connectPromise) {
    return connectPromise;
  }
  connectPromise = (async () => {
    const { ticket } = await fetchMessengerSocketTicket();
    const origin = resolveMessengerApiOrigin();
    const next = io(`${origin}/messenger`, {
      auth: { token: ticket },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });
    await new Promise<void>((resolve, reject) => {
      const onConnect = () => {
        cleanup();
        resolve();
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };
      const cleanup = () => {
        next.off('connect', onConnect);
        next.off('connect_error', onError);
      };
      next.on('connect', onConnect);
      next.on('connect_error', onError);
    });
    next.io.on('reconnect_attempt', () => {
      void fetchMessengerSocketTicket().then(({ ticket: fresh }) => {
        next.auth = { token: fresh };
      });
    });
    socket = next;
    connectPromise = null;
    return next;
  })();
  return connectPromise;
}

export function disconnectMessengerSocket(): void {
  socket?.disconnect();
  socket = null;
  connectPromise = null;
}
