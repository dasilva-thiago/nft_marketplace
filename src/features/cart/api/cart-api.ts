import type {
  AddCartItemRequest,
  Cart,
  Quote,
  QuoteRequest,
  UpdateCartItemRequest,
} from '@/shared/contracts';
import {
  AddCartItemRequestSchema,
  CartSchema,
  QuoteRequestSchema,
  QuoteSchema,
  UpdateCartItemRequestSchema,
} from '@/shared/contracts/schemas';
import { http } from '@/shared/api/http-client';

export const cartApi = {
  async get(signal?: AbortSignal): Promise<Cart> {
    const response = await http.get<unknown>('/cart', { signal });
    return CartSchema.parse(response.data);
  },

  async addItem(input: AddCartItemRequest): Promise<Cart> {
    const payload = AddCartItemRequestSchema.parse(input);
    const response = await http.post<unknown>('/cart/items', payload);
    return CartSchema.parse(response.data);
  },

  async updateItem(nftId: string, input: UpdateCartItemRequest): Promise<Cart> {
    const payload = UpdateCartItemRequestSchema.parse(input);
    const response = await http.patch<unknown>(`/cart/items/${nftId}`, payload);
    return CartSchema.parse(response.data);
  },

  async removeItem(nftId: string): Promise<Cart> {
    const response = await http.delete<unknown>(`/cart/items/${nftId}`);
    return CartSchema.parse(response.data);
  },

  async quote(input: QuoteRequest, signal?: AbortSignal): Promise<Quote> {
    const payload = QuoteRequestSchema.parse(input);
    const response = await http.post<unknown>('/quotes', payload, { signal });
    return QuoteSchema.parse(response.data);
  },
};
