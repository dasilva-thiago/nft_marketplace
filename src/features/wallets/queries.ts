import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWalletRequest, UpdateWalletRequest } from '@/shared/contracts';
import { useSessionQuery } from '@/features/auth/queries';
import { walletsApi } from './api/wallets-api';

export const walletKeys = {
  all: ['private', 'wallets'] as const,
  list: (userId: string) => [...walletKeys.all, userId] as const,
};

export function walletsQuery(userId: string) {
  return queryOptions({
    queryKey: walletKeys.list(userId),
    queryFn: ({ signal }) => walletsApi.list(signal),
    retry: false,
  });
}

export function useWalletsQuery() {
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useQuery({
    ...walletsQuery(userId ?? 'anonymous'),
    enabled: Boolean(userId),
  });
}

export function useCreateWalletMutation() {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useMutation({
    mutationFn: (input: CreateWalletRequest) => walletsApi.create(input),
    retry: false,
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: walletKeys.list(userId) });
    },
  });
}

export function useUpdateWalletMutation() {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useMutation({
    mutationFn: ({ walletId, input }: { walletId: string; input: UpdateWalletRequest }) =>
      walletsApi.update(walletId, input),
    retry: false,
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: walletKeys.list(userId) });
    },
  });
}
