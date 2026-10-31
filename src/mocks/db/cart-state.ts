import type { Cart } from '@/shared/contracts';
import { CartSchema } from '@/shared/contracts/schemas';
import { readMockStorage, removeMockStorage, writeMockStorage } from './storage';

const CARTS_STORAGE_KEY = 'kurio.mock.carts';

type CartEntry = [string, Cart];

function initialCarts(): Map<string, Cart> {
  const stored = readMockStorage<CartEntry[]>(CARTS_STORAGE_KEY);
  if (!Array.isArray(stored)) return new Map();
  return new Map(
    stored.filter(
      (entry): entry is CartEntry =>
        Array.isArray(entry) &&
        typeof entry[0] === 'string' &&
        CartSchema.safeParse(entry[1]).success,
    ),
  );
}

const carts = initialCarts();

function persistCarts(): void {
  writeMockStorage(CARTS_STORAGE_KEY, [...carts.entries()]);
}

export function getCartForUser(userId: string): Cart {
  const existing = carts.get(userId);
  if (existing) return existing;

  const created: Cart = { userId, items: [], version: 1 };
  carts.set(userId, created);
  persistCarts();
  return created;
}

export function saveCartForUser(cart: Cart): Cart {
  carts.set(cart.userId ?? 'guest', cart);
  persistCarts();
  return cart;
}

export function resetMockCartState(): void {
  carts.clear();
  removeMockStorage(CARTS_STORAGE_KEY);
}
