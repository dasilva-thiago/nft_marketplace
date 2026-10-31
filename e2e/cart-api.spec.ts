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
  });
});

test('carrinho autenticado valida estoque e cotação usa precisão decimal', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { readApiError } = await import('/src/features/auth/api/auth-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    const added = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 2 });
    const updated = await cartApi.updateItem('emerald-ape-042', { quantity: 3 });
    const quote = await cartApi.quote({
      items: updated.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
      couponCode: 'KURIO10',
    });
    const unavailable = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 3 }).then(
      () => null,
      (error: unknown) => ({
        status: (error as { response?: { status?: number } }).response?.status,
        apiError: readApiError(error),
      }),
    );
    const removed = await cartApi.removeItem('emerald-ape-042');
    return { added, updated, quote, unavailable, removed };
  });

  expect(result.added.items[0]).toMatchObject({ nftId: 'emerald-ape-042', quantity: 2 });
  expect(result.updated.items[0].quantity).toBe(3);
  expect(result.quote.subtotalEth).toBe('4.35');
  expect(result.quote.discountEth).toBe('0.435');
  expect(result.quote.totalEth).toBe('3.931');
  expect(result.unavailable?.status).toBe(409);
  expect(result.unavailable?.apiError?.code).toBe('AVAILABILITY_CONFLICT');
  expect(result.removed.items).toHaveLength(0);
});
