import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { NftUpdatedPayloadSchema, OrderUpdatedPayloadSchema } from '@/shared/contracts/schemas';
import type { Cart, NftSummary, OrderSnapshot } from '@/shared/contracts';
import { createMarketplaceSocket } from './socket-client';

const catalogKeys = { all: ['catalog'] as const };
const cartKeys = {
  all: ['private', 'cart'] as const,
  detail: (userId: string) => ['private', 'cart', userId] as const,
};
const orderKeys = {
  all: ['private', 'orders'] as const,
  detail: (userId: string, orderId: string) => ['private', 'orders', userId, orderId] as const,
};

type NftPatch = { priceEth: string; availableEditions: number; version: number };

function updateCatalogCache(current: unknown, nftId: string, patch: NftPatch) {
  if (!current || typeof current !== 'object') return current;
  if ('items' in current && Array.isArray(current.items)) {
    return {
      ...current,
      items: current.items.map((item: NftSummary) =>
        item.id === nftId ? { ...item, ...patch } : item,
      ),
    };
  }
  if ('id' in current && current.id === nftId) return { ...current, ...patch };
  return current;
}

function updateCartCache(current: unknown, nftId: string, patch: NftPatch) {
  if (
    !current ||
    typeof current !== 'object' ||
    !('items' in current) ||
    !Array.isArray(current.items)
  )
    return current;
  const cart = current as Cart;
  return {
    ...cart,
    items: cart.items.map((item) =>
      item.nftId === nftId ? { ...item, nft: { ...item.nft, ...patch } } : item,
    ),
  };
}

export function connectMarketplaceRealtime(userId: string, queryClient: QueryClient) {
  const socket = createMarketplaceSocket(userId);
  const latestVersions = new Map<string, number>();
  const accept = (key: string, version: number) => {
    const previous = latestVersions.get(key) ?? 0;
    if (version <= previous) return false;
    latestVersions.set(key, version);
    return true;
  };

  const handleNftUpdated = (event: unknown) => {
    const parsed = NftUpdatedPayloadSchema.safeParse(
      event && typeof event === 'object' && 'payload' in event ? event.payload : null,
    );
    if (!parsed.success || !event || typeof event !== 'object' || !('version' in event)) return;
    const version = event.version;
    if (typeof version !== 'number' || !accept(`nft:${parsed.data.nftId}`, version)) return;
    const patch = { ...parsed.data, version };
    queryClient.setQueriesData({ queryKey: catalogKeys.all }, (current) =>
      updateCatalogCache(current, parsed.data.nftId, patch),
    );
    queryClient.setQueriesData({ queryKey: cartKeys.detail(userId) }, (current) =>
      updateCartCache(current, parsed.data.nftId, patch),
    );
    void queryClient.invalidateQueries({ queryKey: [...cartKeys.all, 'quote', userId] });
  };

  const handleOrderUpdated = (event: unknown) => {
    const parsed = OrderUpdatedPayloadSchema.safeParse(
      event && typeof event === 'object' && 'payload' in event ? event.payload : null,
    );
    if (!parsed.success || !event || typeof event !== 'object' || !('version' in event)) return;
    const version = event.version;
    if (typeof version !== 'number' || !accept(`order:${parsed.data.orderId}`, version)) return;
    queryClient.setQueryData<OrderSnapshot | undefined>(
      orderKeys.detail(userId, parsed.data.orderId),
      (current) =>
        current
          ? {
              ...current,
              status: parsed.data.status,
              transactionRef: parsed.data.transactionRef,
              updatedAt: new Date().toISOString(),
              version,
            }
          : current,
    );
  };

  const reconcile = () => {
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all });
    void queryClient.invalidateQueries({ queryKey: orderKeys.all });
  };
  socket.on('nft.updated', handleNftUpdated);
  socket.on('order.updated', handleOrderUpdated);
  socket.on('connect', reconcile);
  socket.connect();
  return () => {
    socket.off('nft.updated', handleNftUpdated);
    socket.off('order.updated', handleOrderUpdated);
    socket.off('connect', reconcile);
    socket.disconnect();
    latestVersions.clear();
  };
}

export function useMarketplaceRealtime(userId?: string) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!userId) return undefined;
    return connectMarketplaceRealtime(userId, queryClient);
  }, [queryClient, userId]);
}
