import { expect, test } from '@playwright/test';

test('checkout bloqueia cotação antiga e exige revisão após nft.updated', async ({ page }) => {
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

  await page.goto('/checkout');
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();
  await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { queryClient } = await import('/src/shared/query/query-client.ts');
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    queryClient.setQueryData(['private', 'cart', 'collector-ana'], cart);
  });
  await expect(page.getByText('1 itens')).toBeVisible();
  const confirmButton = page.getByRole('button', { name: 'Confirmar compra' });
  await expect(confirmButton).toBeEnabled();
  await page.waitForTimeout(1500);

  await page.evaluate(async () => {
    const response = await fetch('/api/__mock/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'collector-ana',
        event: 'nft.updated',
        eventId: 'checkout-nft-2',
        version: 2,
        payload: { nftId: 'emerald-ape-042', priceEth: '9.99', availableEditions: 2 },
      }),
    });
    if (!response.ok) throw new Error(`Publicação do evento falhou: ${response.status}`);
  });

  await expect(page.getByRole('alert')).toContainText('A cotação foi alterada');
  await expect(page.getByRole('button', { name: 'Revisar nova cotação' })).toBeVisible();
  await expect(confirmButton).toBeDisabled();
  await expect(page.getByText('9.99 ETH').first()).toBeVisible();

  await page.getByRole('button', { name: 'Revisar nova cotação' }).click();
  await expect(confirmButton).toBeEnabled();
});
