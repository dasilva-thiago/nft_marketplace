import { ws } from 'msw';
import { toSocketIo } from '@mswjs/socket.io-binding';
import type { VersionedEvent } from '@/shared/contracts';

export type MockSocketEventName = 'nft.updated' | 'order.updated';
type BoundSocketConnection = ReturnType<typeof toSocketIo>['client'];
const connectionsByUser = new Map<string, Set<BoundSocketConnection>>();

function socketEndpoint(): string {
  const api = new URL(
    import.meta.env.VITE_SOCKET_URL ?? window.location.origin,
    window.location.origin,
  );
  api.protocol = api.protocol === 'https:' ? 'wss:' : 'ws:';
  // MSW normaliza o caminho Socket.IO `/socket.io/` para a raiz ao fazer match.
  api.pathname = '/';
  api.search = '';
  return api.toString();
}

// MSW intercepta o WebSocket Engine.IO; o binding decodifica eventos Socket.IO.
const marketplaceSocket = ws.link(socketEndpoint());
export const socketIoMockHandler = marketplaceSocket.addEventListener(
  'connection',
  (connection) => {
    const { client } = toSocketIo(connection);
    let subscribedUserId: string | undefined;

    client.on('session.subscribe', (_event, payload: { userId: string }) => {
      if (!payload?.userId) return;
      subscribedUserId = payload.userId;
      const userConnections =
        connectionsByUser.get(subscribedUserId) ?? new Set<BoundSocketConnection>();
      userConnections.add(client);
      connectionsByUser.set(subscribedUserId, userConnections);
      client.emit('session.ready', { userId: subscribedUserId });
    });

    connection.client.addEventListener('close', () => {
      if (!subscribedUserId) return;
      const userConnections = connectionsByUser.get(subscribedUserId);
      userConnections?.delete(client);
      if (userConnections?.size === 0) connectionsByUser.delete(subscribedUserId);
    });
  },
);

/** Cenários MSW chamam este publisher para que a alteração chegue pelo socket.io-client. */
export function publishMockSocketEvent<T>(
  userId: string,
  event: MockSocketEventName,
  payload: VersionedEvent<T>,
): void {
  for (const connection of connectionsByUser.get(userId) ?? []) connection.emit(event, payload);
}
