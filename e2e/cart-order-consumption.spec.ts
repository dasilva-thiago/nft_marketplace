import { expect, test } from '@playwright/test';

test('remove somente as quantidades incluídas no pedido confirmado', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const reset = await fetch('/api/__mock/reset', { method: 'POST' });
    if (!reset.ok) throw new Error(`Reset do mock falhou: ${reset.status}`);
    sessionStorage.clear();
  });

  const result = await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 3 });
    await cartApi.addItem({ nftId: 'desert-ape-117', quantity: 1 });
    const consumed = await cartApi.consume({
      items: [{ nftId: 'emerald-ape-042', quantity: 2 }],
    });
    return consumed.items.map(({ nftId, quantity }) => ({ nftId, quantity }));
  });

  expect(result).toEqual([
    { nftId: 'emerald-ape-042', quantity: 1 },
    { nftId: 'desert-ape-117', quantity: 1 },
  ]);
});
