import { http } from '@/shared/api/http';
import type { Nft, NftSummary, PageRequest, PageResponse } from '@/shared/api/contracts';

export const catalogApi = {
  list: async (params: PageRequest, signal?: AbortSignal) =>
    (await http.get<PageResponse<NftSummary>>('/nfts', { params, signal })).data,
  get: async (id: string, signal?: AbortSignal) =>
    (await http.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
};
