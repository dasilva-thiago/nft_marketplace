import type { Favorite } from '@/shared/contracts';
import { FavoriteSchema, FavoritesSchema } from '@/shared/contracts/schemas';
import { http } from '@/shared/api/http-client';

export const favoritesApi = {
  async list(signal?: AbortSignal): Promise<Favorite[]> {
    const response = await http.get<unknown>('/favorites', { signal });
    return FavoritesSchema.parse(response.data);
  },

  async add(nftId: string): Promise<Favorite> {
    const response = await http.put<unknown>(`/favorites/${nftId}`);
    return FavoriteSchema.parse(response.data);
  },

  async remove(nftId: string): Promise<void> {
    await http.delete(`/favorites/${nftId}`);
  },
};
