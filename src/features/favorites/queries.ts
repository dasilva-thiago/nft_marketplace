import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Favorite } from '@/shared/contracts';
import { useSessionQuery } from '@/features/auth/queries';
import { favoritesApi } from './api/favorites-api';

export const favoriteKeys = {
  all: ['private', 'favorites'] as const,
  list: (userId: string) => [...favoriteKeys.all, userId] as const,
};

export function favoritesQuery(userId: string) {
  return queryOptions({
    queryKey: favoriteKeys.list(userId),
    queryFn: ({ signal }) => favoritesApi.list(signal),
    staleTime: 0,
  });
}

export function useFavoritesQuery() {
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useQuery({
    ...favoritesQuery(userId ?? 'anonymous'),
    enabled: Boolean(userId),
  });
}

type ToggleFavoriteInput = {
  nftId: string;
  shouldFavorite: boolean;
};

type MutationContext = {
  previous: Favorite[] | undefined;
};

export function useToggleFavoriteMutation() {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;

  return useMutation<Favorite | void, Error, ToggleFavoriteInput, MutationContext>({
    mutationFn: ({ nftId, shouldFavorite }) =>
      shouldFavorite ? favoritesApi.add(nftId) : favoritesApi.remove(nftId),
    onMutate: async ({ nftId, shouldFavorite }) => {
      if (!userId) return { previous: undefined };
      const key = favoriteKeys.list(userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Favorite[]>(key);
      const optimistic: Favorite = {
        userId,
        nftId,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Favorite[]>(key, (current = []) =>
        shouldFavorite
          ? current.some((favorite) => favorite.nftId === nftId)
            ? current
            : [...current, optimistic]
          : current.filter((favorite) => favorite.nftId !== nftId),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (userId && context?.previous !== undefined)
        queryClient.setQueryData(favoriteKeys.list(userId), context.previous);
    },
    onSettled: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: favoriteKeys.list(userId) });
    },
  });
}
