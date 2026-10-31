import { expect, test } from './fixtures';

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
  await expect(
    page.getByRole('heading', {
      name:
        (page.viewportSize()?.width ?? 1440) <= 520
          ? 'Pagamento com carteira'
          : 'Perfil do colecionador',
    }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { queryClient } = await import('/src/shared/query/query-client.ts');
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    queryClient.setQueryData(['private', 'cart', 'collector-ana'], cart);
  });
  await expect(page.getByRole('radio')).toHaveCount(
    (page.viewportSize()?.width ?? 1440) <= 520 ? 2 : 1,
  );
  const confirmButton = page.getByRole('button', { name: 'Confirmar compra' });
  const quoteTotal = page.locator('.checkout-breakdown .total dd');
  const totalBefore = await quoteTotal.innerText();
  await page.getByRole('button', { name: 'Conectar carteira com MetaMask' }).click();
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
  await expect(quoteTotal).not.toHaveText(totalBefore);

  await page.getByRole('button', { name: 'Revisar nova cotação' }).click();
  await expect(confirmButton).toBeEnabled();
});

test('pedido revalida preço sem evento, exige revisão e só então confirma', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const reset = await fetch('/api/__mock/reset', { method: 'POST' });
    if (!reset.ok) throw new Error(`Reset do mock falhou: ${reset.status}`);
    sessionStorage.clear();
    localStorage.removeItem('kurio.guest-cart-v1');
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
  });

  await page.goto('/checkout');
  await expect(
    page.getByRole('heading', {
      name:
        (page.viewportSize()?.width ?? 1440) <= 520
          ? 'Pagamento com carteira'
          : 'Perfil do colecionador',
    }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { queryClient } = await import('/src/shared/query/query-client.ts');
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    queryClient.setQueryData(['private', 'cart', 'collector-ana'], cart);
  });
  await expect(page.getByRole('radio')).toHaveCount(
    (page.viewportSize()?.width ?? 1440) <= 520 ? 2 : 1,
  );
  await page.getByRole('button', { name: 'Conectar carteira com MetaMask' }).click();
  const confirmButton = page.getByRole('button', { name: 'Confirmar compra' });
  await expect(confirmButton).toBeEnabled();
  if ((page.viewportSize()?.width ?? 1440) > 520) {
    await page.locator('#checkout-username').fill('ana');
    await page.locator('#checkout-profile-name').fill('Ana Colecionadora');
    await page.locator('#checkout-email').fill('ana@kurio.demo');
  }
  const quoteTotal = page.locator('.checkout-breakdown .total dd');
  const totalBefore = await quoteTotal.innerText();

  await page.evaluate(async () => {
    const { updateMockNftMarketData } = await import('/src/mocks/fixtures/nfts.ts');
    updateMockNftMarketData('emerald-ape-042', {
      priceEth: '9.99',
      availableEditions: 2,
      version: 2,
    });
  });

  await confirmButton.click();
  await expect(page.getByRole('alert')).toContainText('A cotação foi alterada');
  await expect(quoteTotal).not.toHaveText(totalBefore);
  await expect(confirmButton).toBeDisabled();
  await page.getByRole('button', { name: 'Revisar nova cotação' }).click();
  await expect(confirmButton).toBeEnabled();

  await confirmButton.click();
  await expect(page).toHaveURL(/\/orders\/order-/);
});
