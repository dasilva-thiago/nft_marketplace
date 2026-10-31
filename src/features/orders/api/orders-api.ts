import type { CreateOrderRequest, OrderSnapshot } from '@/shared/contracts';
import { CreateOrderRequestSchema, OrderSnapshotSchema } from '@/shared/contracts/schemas';
import { http } from '@/shared/api/http-client';

export const ordersApi = {
  async create(input: CreateOrderRequest, idempotencyKey: string): Promise<OrderSnapshot> {
    const payload = CreateOrderRequestSchema.parse(input);
    if (!idempotencyKey.trim()) throw new Error('Idempotency-Key é obrigatório.');
    const response = await http.post<unknown>('/orders', payload, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return OrderSnapshotSchema.parse(response.data);
  },

  async get(orderId: string, signal?: AbortSignal): Promise<OrderSnapshot> {
    const response = await http.get<unknown>(`/orders/${orderId}`, { signal });
    return OrderSnapshotSchema.parse(response.data);
  },

  async recover(idempotencyKey: string, signal?: AbortSignal): Promise<OrderSnapshot> {
    if (!idempotencyKey.trim()) throw new Error('Idempotency-Key é obrigatório.');
    const response = await http.get<unknown>(
      `/orders/by-idempotency/${encodeURIComponent(idempotencyKey)}`,
      { signal },
    );
    return OrderSnapshotSchema.parse(response.data);
  },
};
