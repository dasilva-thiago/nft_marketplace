import { queryOptions } from '@tanstack/react-query';
import { catalogApi } from './api/catalog-api';
import type { PageRequest } from '@/shared/api/contracts';

export const catalogKeys = {
  all: ['catalog'] as const,
  list: (params: PageRequest) => [...catalogKeys.all, 'list', params] as const,
  detail: (id: string) => [...catalogKeys.all, 'detail', id] as const,
};
export const catalogListQuery = (params: PageRequest) =>
  queryOptions({
    queryKey: catalogKeys.list(params),
    queryFn: ({ signal }) => catalogApi.list(params, signal),
  });
export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.detail(id),
    queryFn: ({ signal }) => catalogApi.get(id, signal),
  });
