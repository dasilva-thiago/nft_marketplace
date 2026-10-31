import type { Cart } from '@/shared/contracts';

const carts = new Map<string, Cart>();

export function getCartForUser(userId: string): Cart {
  const existing = carts.get(userId);
  if (existing) return existing;

  const created: Cart = { userId, items: [], version: 1 };
  carts.set(userId, created);
  return created;
}

export function saveCartForUser(cart: Cart): Cart {
  carts.set(cart.userId ?? 'guest', cart);
  return cart;
}

export function resetMockCartState(): void {
  carts.clear();
}
