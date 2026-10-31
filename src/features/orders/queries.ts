import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderRequest } from '@/shared/contracts';
import { useSessionQuery } from '@/features/auth/queries';
import { ordersApi } from './api/orders-api';

export const orderKeys = {
  all: ['private', 'orders'] as const,
  detail: (userId: string, orderId: string) => [...orderKeys.all, userId, orderId] as const,
};

export function orderQuery(userId: string, orderId: string) {
  return queryOptions({
    queryKey: orderKeys.detail(userId, orderId),
    queryFn: ({ signal }) => ordersApi.get(orderId, signal),
    staleTime: 0,
    retry: false,
  });
}

export function useOrderQuery(orderId: string) {
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useQuery({
    ...orderQuery(userId ?? 'anonymous', orderId),
    enabled: Boolean(userId && orderId),
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useMutation({
    mutationFn: ({
      input,
      idempotencyKey,
    }: {
      input: CreateOrderRequest;
      idempotencyKey: string;
    }) => ordersApi.create(input, idempotencyKey),
    retry: false,
    onSuccess: (order) => {
      if (userId) queryClient.setQueryData(orderKeys.detail(userId, order.id), order);
    },
  });
}

export function useRecoverOrderMutation() {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useMutation({
    mutationFn: (idempotencyKey: string) => ordersApi.recover(idempotencyKey),
    retry: false,
    onSuccess: (order) => {
      if (userId) queryClient.setQueryData(orderKeys.detail(userId, order.id), order);
    },
  });
}
