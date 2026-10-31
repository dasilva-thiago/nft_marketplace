import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AddCartItemRequest, QuoteRequest, UpdateCartItemRequest } from '@/shared/contracts';
import { useSessionQuery } from '@/features/auth/queries';
import { cartApi } from './api/cart-api';

export const cartKeys = {
  all: ['private', 'cart'] as const,
  detail: (userId: string) => [...cartKeys.all, userId] as const,
  quote: (userId: string, request: QuoteRequest) =>
    [...cartKeys.all, 'quote', userId, request] as const,
};

export function cartQuery(userId: string) {
  return queryOptions({
    queryKey: cartKeys.detail(userId),
    queryFn: ({ signal }) => cartApi.get(signal),
    staleTime: 0,
  });
}

export function useCartQuery() {
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useQuery({
    ...cartQuery(userId ?? 'anonymous'),
    enabled: Boolean(userId),
  });
}

function useCartMutation<TInput>(mutationFn: (input: TInput) => Promise<unknown>) {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useMutation({
    mutationFn,
    onSuccess: (cart) => {
      if (userId) queryClient.setQueryData(cartKeys.detail(userId), cart);
    },
  });
}

export function useAddCartItemMutation() {
  return useCartMutation((input: AddCartItemRequest) => cartApi.addItem(input));
}

export function useUpdateCartItemMutation() {
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nftId, input }: { nftId: string; input: UpdateCartItemRequest }) =>
      cartApi.updateItem(nftId, input),
    onSuccess: (cart) => {
      if (userId) queryClient.setQueryData(cartKeys.detail(userId), cart);
    },
  });
}

export function useRemoveCartItemMutation() {
  return useCartMutation((nftId: string) => cartApi.removeItem(nftId));
}

export function useQuoteQuery(request: QuoteRequest) {
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useQuery({
    queryKey: cartKeys.quote(userId ?? 'anonymous', request),
    queryFn: ({ signal }) => cartApi.quote(request, signal),
    enabled: Boolean(userId && request.items.length),
    staleTime: 5_000,
    retry: false,
  });
}
