import { expect, test } from './fixtures';

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
  await page.locator('.nft-card').first().waitFor();
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

test('order.updated persiste no REST e impede regressão após estado terminal', async ({ page }) => {
  await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
  });
  await page.reload();
  await page.locator('.nft-card').first().waitFor();
  await page.waitForTimeout(700);
  await page.evaluate(async () => {
    await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'payment-pending' }),
    });
  });

  const order = await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    const { queryClient } = await import('/src/shared/query/query-client.ts');
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    const quote = await cartApi.quote({
      items: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
      walletId: 'wallet-ana-primary',
      network: 'Ethereum',
    });
    const input = { quoteId: quote.quoteId, walletId: 'wallet-ana-primary', network: 'Ethereum' };
    const idempotencyKey = `realtime-${Date.now()}`;
    const created = await ordersApi.create(input, idempotencyKey);
    queryClient.setQueryData(['private', 'orders', 'collector-ana', created.id], created);
    return { id: created.id, version: created.version, input, idempotencyKey };
  });

  const confirmedEvent = await page.evaluate(async ({ id, version }) => {
    const response = await fetch('/api/__mock/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'collector-ana',
        event: 'order.updated',
        eventId: 'order-confirmed-v2',
        version: version + 1,
        payload: { orderId: id, status: 'confirmed', transactionRef: '0xmock-final' },
      }),
    });
    return response.json();
  }, order);
  expect(confirmedEvent).toMatchObject({ published: true });

  await expect
    .poll(
      () =>
        page.evaluate(async (orderId) => {
          const { queryClient } = await import('/src/shared/query/query-client.ts');
          return queryClient.getQueryData(['private', 'orders', 'collector-ana', orderId])?.status;
        }, order.id),
      { timeout: 5_000 },
    )
    .toBe('confirmed');

  const regressedEvent = await page.evaluate(async ({ id, version }) => {
    const response = await fetch('/api/__mock/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'collector-ana',
        event: 'order.updated',
        eventId: 'order-pending-v3',
        version: version + 2,
        payload: { orderId: id, status: 'pending', transactionRef: null },
      }),
    });
    return response.json();
  }, order);
  expect(regressedEvent).toMatchObject({ published: false, reason: 'terminal' });

  const finalState = await page.evaluate(async ({ id, input, idempotencyKey }) => {
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    const [loaded, replayed] = await Promise.all([
      ordersApi.get(id),
      ordersApi.create(input, idempotencyKey),
    ]);
    return { loaded, replayed };
  }, order);
  expect(finalState.loaded).toMatchObject({
    status: 'confirmed',
    transactionRef: '0xmock-final',
    version: order.version + 1,
  });
  expect(finalState.replayed).toMatchObject({
    id: order.id,
    status: 'confirmed',
    transactionRef: '0xmock-final',
    version: order.version + 1,
  });
});
