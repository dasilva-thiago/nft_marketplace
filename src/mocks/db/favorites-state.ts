import type { Favorite } from '@/shared/contracts';

const favorites = new Map<string, Map<string, Favorite>>();

export function listFavoritesForUser(userId: string): Favorite[] {
  return [...(favorites.get(userId)?.values() ?? [])];
}

export function addFavoriteForUser(userId: string, nftId: string): Favorite {
  const userFavorites = favorites.get(userId) ?? new Map<string, Favorite>();
  const existing = userFavorites.get(nftId);
  if (existing) return existing;

  const favorite: Favorite = {
    userId,
    nftId,
    createdAt: new Date().toISOString(),
  };
  userFavorites.set(nftId, favorite);
  favorites.set(userId, userFavorites);
  return favorite;
}

export function removeFavoriteForUser(userId: string, nftId: string): void {
  favorites.get(userId)?.delete(nftId);
}

export function resetMockFavoritesState(): void {
  favorites.clear();
}
