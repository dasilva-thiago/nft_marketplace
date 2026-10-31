import { io, type Socket } from 'socket.io-client';
import type { VersionedEvent } from '@/shared/contracts';

export type MarketplaceServerEvents = {
  'nft.updated': (event: VersionedEvent<unknown>) => void;
  'order.updated': (event: VersionedEvent<unknown>) => void;
  'session.ready': (event: { userId: string }) => void;
};
export type MarketplaceClientEvents = {
  'session.subscribe': (payload: { userId: string }) => void;
};
export type MarketplaceSocket = Socket<MarketplaceServerEvents, MarketplaceClientEvents>;

export function createMarketplaceSocket(userId: string): MarketplaceSocket {
  const socket = io(import.meta.env.VITE_SOCKET_URL ?? window.location.origin, {
    autoConnect: false,
    path: '/socket.io/',
    transports:
      import.meta.env.VITE_ENABLE_MOCKS === 'true' ? ['websocket'] : ['websocket', 'polling'],
    auth: { userId },
  });
  socket.on('connect', () => socket.emit('session.subscribe', { userId }));
  return socket;
}
