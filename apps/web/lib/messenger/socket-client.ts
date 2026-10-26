'use client';

import { io, type Socket } from 'socket.io-client';
import { fetchMessengerSocketTicket } from './messenger-api';
import { resolveMessengerApiOrigin } from './resolve-api-origin';

let socket: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;

const CONNECT_TIMEOUT_MS = 15_000;

function waitForConnect(next: Socket): Promise<void> {
  if (next.connected) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Messenger socket connection timed out'));
    }, CONNECT_TIMEOUT_MS);
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      clearTimeout(timer);
      next.off('connect', onConnect);
      next.off('connect_error', onError);
    };
    next.on('connect', onConnect);
    next.on('connect_error', onError);
    next.connect();
  });
}

async function connectFreshSocket(): Promise<Socket> {
  const { ticket } = await fetchMessengerSocketTicket();
  const origin = resolveMessengerApiOrigin();
  const next = io(`${origin}/messenger`, {
    auth: { token: ticket },
    transports: ['websocket', 'polling'],
    reconnection: true,
    autoConnect: true,
  });
  await waitForConnect(next);
  next.io.on('reconnect_attempt', () => {
    void fetchMessengerSocketTicket().then(({ ticket: fresh }) => {
      next.auth = { token: fresh };
    });
  });
  return next;
}

export async function getMessengerSocket(): Promise<Socket> {
  if (socket?.connected) {
    return socket;
  }
  if (socket && !socket.connected) {
    try {
      await waitForConnect(socket);
      return socket;
    } catch {
      socket.disconnect();
      socket = null;
    }
  }
  if (connectPromise) {
    return connectPromise;
  }
  connectPromise = (async () => {
    try {
      const next = await connectFreshSocket();
      socket = next;
      return next;
    } finally {
      connectPromise = null;
    }
  })();
  return connectPromise;
}

export function disconnectMessengerSocket(): void {
  socket?.disconnect();
  socket = null;
  connectPromise = null;
}

const DEFAULT_ACK_TIMEOUT_MS = 20_000;

export async function messengerEmitWithAck<T>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeoutMs = DEFAULT_ACK_TIMEOUT_MS,
): Promise<T> {
  return Promise.race([
    socket.emitWithAck(event, payload) as Promise<T>,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Messenger socket request timed out')), timeoutMs);
    }),
  ]);
}
