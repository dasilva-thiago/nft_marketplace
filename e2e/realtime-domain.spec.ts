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

test('nft.updated atualiza caches e ignora evento com versão antiga', async ({ page }) => {
  await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
  });
  await page.reload();
  await page.getByRole('heading', { name: 'Peças em destaque' }).waitFor();
  await page.waitForTimeout(700);

  const result = await page.evaluate(async () => {
    const publish = (version: number, priceEth: string) =>
      fetch('/api/__mock/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'collector-ana',
          event: 'nft.updated',
          eventId: `nft-${version}`,
          version,
          payload: { nftId: 'emerald-ape-042', priceEth, availableEditions: 2 },
        }),
      });
    await publish(2, '9.99');
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    await publish(1, '1.11');
    await new Promise((resolve) => window.setTimeout(resolve, 300));
    const { queryClient } = await import('/src/shared/query/query-client.ts');
    const entries = queryClient.getQueriesData({ queryKey: ['catalog'] });
    const list = entries.find(([, value]) =>
      Boolean(value && typeof value === 'object' && 'items' in value),
    );
    const item =
      list && list[1] && typeof list[1] === 'object' && 'items' in list[1]
        ? list[1].items.find((candidate: { id: string }) => candidate.id === 'emerald-ape-042')
        : null;
    return item;
  });

  expect(result).toMatchObject({ priceEth: '9.99', availableEditions: 2, version: 2 });
});

test('order.updated atualiza pedido e ignora duplicata da mesma versão', async ({ page }) => {
  await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
  });
  await page.reload();
  await page.getByRole('heading', { name: 'Peças em destaque' }).waitFor();
  await page.waitForTimeout(700);

  const result = await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    const { queryClient } = await import('/src/shared/query/query-client.ts');
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    const quote = await cartApi.quote({
      items: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
      walletId: 'metamask',
      network: 'Ethereum',
    });
    const order = await ordersApi.create(
      { quoteId: quote.quoteId, walletId: 'metamask', network: 'Ethereum' },
      `realtime-${Date.now()}`,
    );
    queryClient.setQueryData(['private', 'orders', 'collector-ana', order.id], order);

    async function publish(
      status: 'pending' | 'confirmed',
      version: number,
      transactionRef: string | null,
    ) {
      await fetch('/api/__mock/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'collector-ana',
          event: 'order.updated',
          eventId: `order-${version}`,
          version,
          payload: { orderId: order.id, status, transactionRef },
        }),
      });
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
    await publish('pending', 2, null);
    await publish('confirmed', 2, '0xignored-old-duplicate');
    return queryClient.getQueryData(['private', 'orders', 'collector-ana', order.id]);
  });

  expect(result).toMatchObject({ status: 'pending', transactionRef: null, version: 2 });
});
