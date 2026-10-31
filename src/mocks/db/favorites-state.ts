import type { Favorite } from '@/shared/contracts';
import { FavoriteSchema } from '@/shared/contracts/schemas';
import { readMockStorage, removeMockStorage, writeMockStorage } from './storage';

const FAVORITES_STORAGE_KEY = 'kurio.mock.favorites';
type FavoriteEntry = [string, Favorite[]];

function initialFavorites(): Map<string, Map<string, Favorite>> {
  const stored = readMockStorage<FavoriteEntry[]>(FAVORITES_STORAGE_KEY);
  if (!Array.isArray(stored)) return new Map();
  return new Map(
    stored
      .filter(
        (entry): entry is FavoriteEntry => Array.isArray(entry) && typeof entry[0] === 'string',
      )
      .map(([userId, items]) => [
        userId,
        new Map(
          (Array.isArray(items) ? items : [])
            .filter((item) => FavoriteSchema.safeParse(item).success)
            .map((item) => [item.nftId, item]),
        ),
      ]),
  );
}

const favorites = initialFavorites();

function persistFavorites(): void {
  writeMockStorage(
    FAVORITES_STORAGE_KEY,
    [...favorites.entries()].map(([userId, items]) => [userId, [...items.values()]]),
  );
}

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
  persistFavorites();
  return favorite;
}

export function removeFavoriteForUser(userId: string, nftId: string): void {
  favorites.get(userId)?.delete(nftId);
  persistFavorites();
}

export function resetMockFavoritesState(): void {
  favorites.clear();
  removeMockStorage(FAVORITES_STORAGE_KEY);
}
