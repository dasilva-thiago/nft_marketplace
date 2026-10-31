import { expect, test } from './fixtures';

async function expectCheckoutTitle(page: import('@playwright/test').Page) {
  const isMobile = (page.viewportSize()?.width ?? 1440) <= 520;
  await expect(
    page.getByRole('heading', {
      name: isMobile ? 'Pagamento com carteira' : 'Perfil do colecionador',
    }),
  ).toBeVisible();
}

async function prepareCheckout(page: import('@playwright/test').Page) {
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
  await expectCheckoutTitle(page);
  await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { queryClient } = await import('/src/shared/query/query-client.ts');
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    queryClient.setQueryData(['private', 'cart', 'collector-ana'], cart);
  });
  await expect(page.getByRole('radio')).toHaveCount(
    (page.viewportSize()?.width ?? 1440) <= 520 ? 2 : 1,
  );
  await expect(page.locator('.checkout-breakdown .total dd')).not.toHaveText('—');
}

test('pagamento mobile mostra carteiras/rede e total sem painel de perfil', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Composição específica de mobile.');
  await prepareCheckout(page);
  await expect(page.locator('#checkout-username')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Carteira e rede' })).toBeVisible();
  await expect(page.getByText('Total').last()).toBeVisible();
  const polygonWallet = page.getByRole('radio', { name: 'Reserva, rede Polygon' });
  await polygonWallet.check();
  await expect(polygonWallet).toBeChecked();
  await expect(page.getByRole('button', { name: /Conectar carteira com/ })).toHaveCount(3);
  const dimensions = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  expect(dimensions[0]).toBeLessThanOrEqual(dimensions[1]);
});

async function setScenario(page: import('@playwright/test').Page, scenario: string) {
  const responseOk = await page.evaluate(async (name) => {
    const response = await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: name }),
    });
    return response.ok;
  }, scenario);
  expect(responseOk).toBeTruthy();
}

test('seleciona, conecta e desconecta uma carteira registrada', async ({ page }) => {
  await prepareCheckout(page);
  const confirmButton = page.getByRole('button', { name: 'Confirmar compra' });
  await expect(confirmButton).toBeDisabled();

  await page.getByRole('button', { name: 'Conectar carteira com MetaMask' }).click();
  await expect(page.getByRole('status')).toContainText('conectada à rede Ethereum');
  await expect(confirmButton).toBeEnabled();

  await page.getByRole('button', { name: 'Desconectar carteira' }).click();
  await expect(page.getByRole('status')).toContainText('foi desconectada');
  await expect(confirmButton).toBeDisabled();
});

test('conexão recusada pela carteira não habilita a confirmação', async ({ page }) => {
  await prepareCheckout(page);
  await setScenario(page, 'wallet-rejected');
  await page.getByRole('button', { name: 'Conectar carteira com MetaMask' }).click();

  await expect(page.getByRole('alert')).toContainText('conexão foi recusada');
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();
});

test('carteira desconectada não habilita a confirmação', async ({ page }) => {
  await prepareCheckout(page);
  await setScenario(page, 'wallet-disconnected');
  await page.getByRole('button', { name: 'Conectar carteira com MetaMask' }).click();

  await expect(page.getByRole('status')).toContainText('está desconectada');
  await expect(page.getByRole('button', { name: 'Confirmar compra' })).toBeDisabled();
});

test('cotação rejeita carteira que pertence a outra conta', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await page.evaluate(async () => {
    const reset = await fetch('/api/__mock/reset', { method: 'POST' });
    if (!reset.ok) throw new Error(`Reset do mock falhou: ${reset.status}`);
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
  });
  const status = await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    try {
      await cartApi.quote({
        items: [{ nftId: 'cyber-ape-008', quantity: 1 }],
        walletId: 'wallet-bruno-primary',
        network: 'Polygon',
      });
      return 200;
    } catch (error) {
      return (error as { response?: { status?: number } }).response?.status ?? 0;
    }
  });
  expect(status).toBe(403);
});
