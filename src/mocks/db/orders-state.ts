import type { CreateOrderRequest, OrderSnapshot, OrderStatus, Quote } from '@/shared/contracts';
import { OrderSnapshotSchema } from '@/shared/contracts/schemas';
import { readMockStorage, removeMockStorage, writeMockStorage } from './storage';

const ORDERS_STORAGE_KEY = 'kurio.mock.orders';

type StoredOrder = {
  fingerprint: string;
  order: OrderSnapshot;
};

type PersistedOrders = {
  orders?: unknown;
  idempotency?: unknown;
  consumedCartOrderIds?: unknown;
};

type OrderState = {
  orders: Map<string, OrderSnapshot>;
  idempotency: Map<string, Map<string, StoredOrder>>;
  consumedCartOrderIds: Set<string>;
};

function initialState(): OrderState {
  const stored = readMockStorage<PersistedOrders>(ORDERS_STORAGE_KEY);
  const validOrders = Array.isArray(stored?.orders)
    ? stored.orders.flatMap((candidate) => {
        const parsed = OrderSnapshotSchema.safeParse(candidate);
        return parsed.success ? [parsed.data] : [];
      })
    : [];
  const orders = new Map(validOrders.map((order) => [order.id, order]));
  const idempotency = new Map<string, Map<string, StoredOrder>>();

  if (Array.isArray(stored?.idempotency)) {
    for (const entry of stored.idempotency) {
      if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !Array.isArray(entry[1]))
        continue;
      const userEntries = new Map<string, StoredOrder>();
      for (const pair of entry[1]) {
        if (
          !Array.isArray(pair) ||
          typeof pair[0] !== 'string' ||
          !pair[1] ||
          typeof pair[1] !== 'object'
        )
          continue;
        const candidate = pair[1] as Partial<StoredOrder>;
        const parsed = OrderSnapshotSchema.safeParse(candidate.order);
        if (typeof candidate.fingerprint !== 'string' || !parsed.success) continue;
        const order = orders.get(parsed.data.id) ?? parsed.data;
        orders.set(order.id, order);
        userEntries.set(pair[0], { fingerprint: candidate.fingerprint, order });
      }
      idempotency.set(entry[0], userEntries);
    }
  }

  const consumedCartOrderIds = new Set(
    Array.isArray(stored?.consumedCartOrderIds)
      ? stored.consumedCartOrderIds.filter((id): id is string => typeof id === 'string')
      : [],
  );
  return { orders, idempotency, consumedCartOrderIds };
}

const state = initialState();
const { orders, idempotency, consumedCartOrderIds } = state;

function consumptionKey(userId: string, orderId: string): string {
  return `${userId}:${orderId}`;
}

function persistOrders(): void {
  writeMockStorage(ORDERS_STORAGE_KEY, {
    orders: [...orders.values()],
    idempotency: [...idempotency.entries()].map(([userId, keys]) => [userId, [...keys.entries()]]),
    consumedCartOrderIds: [...consumedCartOrderIds],
  });
}

export function createOrderForUser(
  userId: string,
  request: CreateOrderRequest,
  quote: Quote,
  idempotencyKey: string,
  status: OrderStatus = 'confirmed',
):
  | { kind: 'created'; order: OrderSnapshot }
  | { kind: 'replayed'; order: OrderSnapshot }
  | { kind: 'conflict' } {
  const userKeys = idempotency.get(userId) ?? new Map<string, StoredOrder>();
  const fingerprint = JSON.stringify(request);
  const previous = userKeys.get(idempotencyKey);
  if (previous) {
    if (previous.fingerprint !== fingerprint) return { kind: 'conflict' };
    return { kind: 'replayed', order: previous.order };
  }

  const now = new Date().toISOString();
  const order: OrderSnapshot = {
    id: `order-${Date.now()}`,
    userId,
    status,
    items: quote.items.map((item) => ({ ...item })),
    quote: structuredClone(quote),
    transactionRef: status === 'confirmed' ? `0xmock-${Date.now().toString(16)}` : null,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  orders.set(order.id, order);
  userKeys.set(idempotencyKey, { fingerprint, order });
  idempotency.set(userId, userKeys);
  persistOrders();
  return { kind: 'created', order };
}

export function getOrderForUser(userId: string, orderId: string): OrderSnapshot | undefined {
  const order = orders.get(orderId);
  return order?.userId === userId ? order : undefined;
}

export function updateOrderForUser(
  userId: string,
  orderId: string,
  status: OrderStatus,
  transactionRef: string | null,
  version: number,
):
  | { kind: 'updated'; order: OrderSnapshot }
  | { kind: 'ignored'; order: OrderSnapshot; reason: 'stale' | 'terminal' | 'invalid-transition' }
  | { kind: 'missing' } {
  const current = getOrderForUser(userId, orderId);
  if (!current) return { kind: 'missing' };
  if (version <= current.version) return { kind: 'ignored', order: current, reason: 'stale' };
  if (current.status !== 'pending') return { kind: 'ignored', order: current, reason: 'terminal' };
  if (status === 'pending')
    return { kind: 'ignored', order: current, reason: 'invalid-transition' };

  const updated: OrderSnapshot = {
    ...current,
    status,
    transactionRef,
    updatedAt: new Date().toISOString(),
    version,
  };
  orders.set(orderId, updated);
  for (const stored of idempotency.get(userId)?.values() ?? []) {
    if (stored.order.id === orderId) stored.order = updated;
  }
  persistOrders();
  return { kind: 'updated', order: updated };
}

export function getOrderByIdempotencyKey(
  userId: string,
  idempotencyKey: string,
): OrderSnapshot | undefined {
  return idempotency.get(userId)?.get(idempotencyKey)?.order;
}

export function isCartConsumedForOrder(userId: string, orderId: string): boolean {
  return consumedCartOrderIds.has(consumptionKey(userId, orderId));
}

export function markCartConsumedForOrder(userId: string, orderId: string): void {
  consumedCartOrderIds.add(consumptionKey(userId, orderId));
  persistOrders();
}

export function resetMockOrdersState(): void {
  orders.clear();
  idempotency.clear();
  consumedCartOrderIds.clear();
  removeMockStorage(ORDERS_STORAGE_KEY);
}
