import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LoginRequest, RegisterRequest, Session } from '@/shared/contracts';
import { authApi } from './api/auth-api';

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
    onSuccess: (session: Session) => {
      queryClient.setQueryData(sessionQueryKey, session);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterRequest) => authApi.register(input),
    onSuccess: (session: Session) => {
      queryClient.setQueryData(sessionQueryKey, session);
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
