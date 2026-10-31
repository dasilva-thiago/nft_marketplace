import { expect, test } from './fixtures';

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
      walletId: 'wallet-ana-primary',
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
      .create(
        { quoteId: quote.quoteId, walletId: 'wallet-ana-primary', network: 'Ethereum' },
        idempotencyKey,
      )
      .then(
        () => null,
        (error: unknown) => ({ code: (error as { code?: string }).code }),
      );
    return { timeout, idempotencyKey, quoteId: quote.quoteId };
  });

  expect(result.timeout?.code).toBe('ECONNABORTED');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  const recovered = await page.evaluate(async ({ idempotencyKey, quoteId }) => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    const { getQuoteForUser } = await import('/src/mocks/db/quotes-state.ts');
    const session = await authApi.getSession();
    if (!session) throw new Error('A sessão expirou antes da recuperação.');
    const order = await ordersApi.recover(idempotencyKey);
    const replay = await ordersApi.create(
      { quoteId, walletId: 'wallet-ana-primary', network: 'Ethereum' },
      idempotencyKey,
    );
    return {
      order,
      replay,
      savedQuoteId: getQuoteForUser(session.user.id, quoteId)?.quoteId,
    };
  }, result);
  expect(recovered.order.status).toBe('confirmed');
  expect(recovered.replay.id).toBe(recovered.order.id);
  expect(recovered.savedQuoteId).toBe(result.quoteId);
});
