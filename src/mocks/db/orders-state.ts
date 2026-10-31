import type { CreateOrderRequest, OrderSnapshot, OrderStatus, Quote } from '@/shared/contracts';

type StoredOrder = {
  fingerprint: string;
  order: OrderSnapshot;
};

const orders = new Map<string, OrderSnapshot>();
const idempotency = new Map<string, Map<string, StoredOrder>>();

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
  return { kind: 'created', order };
}

export function getOrderForUser(userId: string, orderId: string): OrderSnapshot | undefined {
  const order = orders.get(orderId);
  return order?.userId === userId ? order : undefined;
}

export function resetMockOrdersState(): void {
  orders.clear();
  idempotency.clear();
}
