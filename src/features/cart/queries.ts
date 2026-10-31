import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AddCartItemRequest,
  ConsumeCartRequest,
  QuoteRequest,
  UpdateCartItemRequest,
} from '@/shared/contracts';
import { useSessionQuery } from '@/features/auth/queries';
import { catalogApi } from '@/features/catalog/api/catalog-api';
import { addGuestItem, buildGuestCart, removeGuestItem, updateGuestItem } from './guest-cart';
import { cartApi } from './api/cart-api';

export const cartKeys = {
  all: ['private', 'cart'] as const,
  detail: (userId: string) => [...cartKeys.all, userId] as const,
  quote: (userId: string, request: QuoteRequest) =>
    [...cartKeys.all, 'quote', userId, request] as const,
  guest: ['guest', 'cart'] as const,
};

async function getGuestCart(signal?: AbortSignal) {
  const catalog = await catalogApi.list({ page: 1, pageSize: 100 }, signal);
  return buildGuestCart(catalog.items);
}

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
    queryKey: userId ? cartKeys.detail(userId) : cartKeys.guest,
    queryFn: ({ signal }) => (userId ? cartApi.get(signal) : getGuestCart(signal)),
    enabled: sessionQuery.isSuccess || sessionQuery.isError,
    staleTime: 0,
  });
}

function useCartMutation<TInput>(
  mutationFn: (input: TInput) => Promise<unknown>,
  guestMutation?: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useMutation({
    mutationFn: (input: TInput) =>
      userId || !guestMutation ? mutationFn(input) : guestMutation(input),
    onSuccess: (cart) => {
      queryClient.setQueryData(userId ? cartKeys.detail(userId) : cartKeys.guest, cart);
    },
  });
}

export function useAddCartItemMutation() {
  return useCartMutation(
    (input: AddCartItemRequest) => cartApi.addItem(input),
    async (input) => {
      addGuestItem(input.nftId, input.quantity);
      return getGuestCart();
    },
  );
}

export function useUpdateCartItemMutation() {
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nftId, input }: { nftId: string; input: UpdateCartItemRequest }) => {
      if (userId) return cartApi.updateItem(nftId, input);
      updateGuestItem(nftId, input.quantity);
      return getGuestCart();
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(userId ? cartKeys.detail(userId) : cartKeys.guest, cart);
    },
  });
}

export function useRemoveCartItemMutation() {
  return useCartMutation(
    (nftId: string) => cartApi.removeItem(nftId),
    async (nftId) => {
      removeGuestItem(nftId);
      return getGuestCart();
    },
  );
}

export function useConsumeCartMutation() {
  return useCartMutation(
    (input: ConsumeCartRequest) => cartApi.consume(input),
    async () => getGuestCart(),
  );
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
