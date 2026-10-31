import { expect, test } from '@playwright/test';

test('recupera pedido persistido após timeout de rede usando a mesma chave', async ({ page }) => {
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
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    const quote = await cartApi.quote({
      items: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
      walletId: 'metamask',
      network: 'Ethereum',
    });
    const scenario = await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'order-timeout' }),
    });
    if (!scenario.ok) throw new Error(`Cenário falhou: ${scenario.status}`);

    const idempotencyKey = `timeout-${Date.now()}`;
    const timeout = await ordersApi
      .create({ quoteId: quote.quoteId, walletId: 'metamask', network: 'Ethereum' }, idempotencyKey)
      .then(
        () => null,
        (error: unknown) => ({ code: (error as { code?: string }).code }),
      );
    const recovered = await ordersApi.recover(idempotencyKey);
    const replayed = await ordersApi.create(
      { quoteId: quote.quoteId, walletId: 'metamask', network: 'Ethereum' },
      idempotencyKey,
    );
    return { timeout, recovered, replayed };
  });

  expect(result.timeout?.code).toBe('ECONNABORTED');
  expect(result.recovered.status).toBe('confirmed');
  expect(result.replayed.id).toBe(result.recovered.id);
});
