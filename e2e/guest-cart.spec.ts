import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/reset', { method: 'POST' });
    if (!response.ok) throw new Error(`Reset do mock falhou: ${response.status}`);
    sessionStorage.clear();
    localStorage.clear();
  });
});

test('carrinho visitante persiste e é mesclado sem descartar quantidades', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { addGuestItem, getGuestLines, clearGuestCart } = await import(
      '/src/features/cart/guest-cart.ts'
    );
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    addGuestItem('emerald-ape-042', 1);
    addGuestItem('emerald-ape-042', 2);
    const guestLines = getGuestLines();
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    const merged = await cartApi.merge({ items: guestLines });
    const persisted = await cartApi.get();
    clearGuestCart();
    return { guestLines, merged, persisted };
  });

  expect(result.guestLines).toEqual([{ nftId: 'emerald-ape-042', quantity: 3 }]);
  expect(result.merged.items[0].quantity).toBe(3);
  expect(result.persisted.items[0].nftId).toBe('emerald-ape-042');
  expect(result.persisted.items[0].quantity).toBe(3);
});
