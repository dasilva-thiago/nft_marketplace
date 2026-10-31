import { expect, test } from '@playwright/test';

test('atualiza a confirmação visual quando pedido pending recebe evento realtime', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const reset = await fetch('/api/__mock/reset', { method: 'POST' });
    if (!reset.ok) throw new Error(`Reset do mock falhou: ${reset.status}`);
    sessionStorage.clear();
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
  });

  const order = await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    const scenario = await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'payment-pending' }),
    });
    if (!scenario.ok) throw new Error(`Cenário falhou: ${scenario.status}`);
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    const quote = await cartApi.quote({
      items: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
      walletId: 'metamask',
      network: 'Ethereum',
    });
    return ordersApi.create(
      { quoteId: quote.quoteId, walletId: 'metamask', network: 'Ethereum' },
      `realtime-ui-${Date.now()}`,
    );
  });

  await page.evaluate(async (orderId) => {
    const { router } = await import('/src/app/router.tsx');
    await router.navigate({ to: '/orders/$orderId', params: { orderId } });
  }, order.id);
  await expect(page.getByText('Seu pedido está sendo processado')).toBeVisible();
  await expect(page.getByText('pending', { exact: true })).toBeVisible();
  await page.waitForTimeout(700);

  await page.evaluate(async (orderId) => {
    const response = await fetch('/api/__mock/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'collector-ana',
        event: 'order.updated',
        eventId: `order-confirmed-${orderId}`,
        version: 2,
        payload: { orderId, status: 'confirmed', transactionRef: '0xconfirmed' },
      }),
    });
    if (!response.ok) throw new Error(`Publicação do evento falhou: ${response.status}`);
  }, order.id);

  await expect(page.getByText('Seus NFTs agora estão na sua carteira')).toBeVisible();
  await expect(page.getByText('confirmed', { exact: true })).toBeVisible();
  await expect(page.getByText('Transação simulada confirmada: 0xconfirmed.')).toBeVisible();
});
