import { QueryClient } from '@tanstack/react-query';

// Cache apenas dados remotos; dados privados deverão usar chaves isoladas por userId.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: 0 },
  },
});
