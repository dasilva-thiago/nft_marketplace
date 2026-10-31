import { useQuery } from '@tanstack/react-query';

export const realtimeKeys = {
  nftUpdated: (userId: string) => ['private', 'realtime', 'nft-updated', userId] as const,
};

export interface NftRealtimeUpdate {
  nftId: string;
  version: number;
  occurredAt: string;
}

export function useNftRealtimeUpdate(userId?: string) {
  const key = userId
    ? realtimeKeys.nftUpdated(userId)
    : (['private', 'realtime', 'nft-updated', 'anonymous'] as const);
  return useQuery<NftRealtimeUpdate | undefined>({
    queryKey: key,
    queryFn: async () => undefined,
    enabled: false,
  }).data;
}
