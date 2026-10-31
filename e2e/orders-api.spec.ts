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

test('pedido usa snapshot da cotação e chave de idempotência', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    const { readApiError } = await import('/src/features/auth/api/auth-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    const quote = await cartApi.quote({
      items: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
      walletId: 'metamask',
      network: 'Ethereum',
    });
    const key = `e2e-order-${Date.now()}`;
    const created = await ordersApi.create(
      { quoteId: quote.quoteId, walletId: 'metamask', network: 'Ethereum' },
      key,
    );
    const replayed = await ordersApi.create(
      { quoteId: quote.quoteId, walletId: 'metamask', network: 'Ethereum' },
      key,
    );
    const differentPayload = await ordersApi
      .create({ quoteId: quote.quoteId, walletId: 'coinbase', network: 'Ethereum' }, key)
      .then(
        () => null,
        (error: unknown) => ({
          status: (error as { response?: { status?: number } }).response?.status,
          apiError: readApiError(error),
        }),
      );
    const loaded = await ordersApi.get(created.id);
    return { created, replayed, differentPayload, loaded };
  });

  expect(result.created.status).toBe('confirmed');
  expect(result.created.items[0].unitPriceEth).toBe('1.45');
  expect(result.replayed.id).toBe(result.created.id);
  expect(result.replayed.quote.quoteId).toBe(result.created.quote.quoteId);
  expect(result.differentPayload?.status).toBe(409);
  expect(result.differentPayload?.apiError?.code).toBe('CONFLICT');
  expect(result.loaded.id).toBe(result.created.id);
});

test('backend simula pedido pendente e pagamento recusado', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    const cart = await cartApi.addItem({ nftId: 'desert-ape-117', quantity: 1 });
    const quote = await cartApi.quote({
      items: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
      walletId: 'metamask',
      network: 'Ethereum',
    });
    const setScenario = async (scenario: 'payment-pending' | 'payment-rejected') => {
      const response = await fetch('/api/__mock/scenario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      if (!response.ok) throw new Error(`Cenário falhou: ${response.status}`);
    };
    await setScenario('payment-pending');
    const pending = await ordersApi.create(
      { quoteId: quote.quoteId, walletId: 'metamask', network: 'Ethereum' },
      `pending-${Date.now()}`,
    );
    await setScenario('payment-rejected');
    const rejected = await ordersApi.create(
      { quoteId: quote.quoteId, walletId: 'metamask', network: 'Ethereum' },
      `rejected-${Date.now()}`,
    );
    return { pending, rejected };
  });

  expect(result.pending.status).toBe('pending');
  expect(result.pending.transactionRef).toBeNull();
  expect(result.rejected.status).toBe('rejected');
  expect(result.rejected.transactionRef).toBeNull();
});
