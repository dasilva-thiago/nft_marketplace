import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginRequest, RegisterRequest, Session } from '@/shared/contracts';
import { authApi } from './api/auth-api';
import { cartApi } from '@/features/cart/api/cart-api';
import { clearGuestCart, getGuestLines } from '@/features/cart/guest-cart';

export const sessionQueryKey = ['session'] as const;

export function useSessionQuery() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: authApi.getSession,
    retry: false,
    staleTime: 0,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginRequest) => authApi.login(input),
    onSuccess: async (session: Session) => {
      queryClient.setQueryData(sessionQueryKey, session);
      const lines = getGuestLines();
      if (lines.length) {
        const cart = await cartApi.merge({ items: lines });
        queryClient.setQueryData(['private', 'cart', session.user.id], cart);
        clearGuestCart();
      }
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterRequest) => authApi.register(input),
    onSuccess: async (session: Session) => {
      queryClient.setQueryData(sessionQueryKey, session);
      const lines = getGuestLines();
      if (lines.length) {
        const cart = await cartApi.merge({ items: lines });
        queryClient.setQueryData(['private', 'cart', session.user.id], cart);
        clearGuestCart();
      }
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null);
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'private' });
    },
  });
}
