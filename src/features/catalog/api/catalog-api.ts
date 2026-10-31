import { http } from '@/shared/api/http-client';
import type { Nft, NftSummary, PageRequest, PageResponse } from '@/shared/contracts';
import { NftSchema, NftSummarySchema, PageResponseSchema } from '@/shared/contracts/schemas';

const nftListSchema = PageResponseSchema(NftSummarySchema);

export const catalogApi = {
  list: async (params: PageRequest, signal?: AbortSignal): Promise<PageResponse<NftSummary>> => {
    const response = await http.get<unknown>('/nfts', { params, signal });
    return nftListSchema.parse(response.data);
  },
  get: async (id: string, signal?: AbortSignal): Promise<Nft> => {
    const response = await http.get<unknown>(`/nfts/${encodeURIComponent(id)}`, { signal });
    return NftSchema.parse(response.data);
  },
};
