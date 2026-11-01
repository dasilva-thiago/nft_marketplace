import { expect, test, type Page } from './fixtures';

async function resetDemo(page: Page) {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await page.evaluate(() => sessionStorage.clear());
  await page.reload();
  await page.waitForFunction(
    async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nao-existe@kurio.demo', password: 'senha-invalida' }),
      });
      return (
        response.status === 401 &&
        response.headers.get('content-type')?.includes('application/json') === true
      );
    },
    null,
    { timeout: 10_000 },
  );
  await page.evaluate(() => document.fonts.ready);
}

async function seedCart(page: Page, nftIds: string[]) {
  await page.evaluate(async (ids) => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    for (const nftId of ids) await cartApi.addItem({ nftId, quantity: 1 });
  }, nftIds);
}

async function expectScreenshot(page: Page, name: string, fullPage = true) {
  await expect(page).toHaveScreenshot(name, {
    fullPage,
    animations: 'disabled',
    caret: 'hide',
    maxDiffPixelRatio: 0.015,
  });
}

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

test('home: visual baseline', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await page.locator('.nft-grid .nft-card').first().waitFor();
  await expectScreenshot(page, 'home.png', false);
});

test('detalhe: visual baseline', async ({ page }) => {
  await page.goto('/nft/emerald-ape-042');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await page.locator('.detail-main-image').waitFor();
  await expectScreenshot(page, 'detail.png');
});

test('carrinho: visual baseline com quatro NFTs e cotação real do mock', async ({ page }) => {
  const nfts = await page.evaluate(async () => {
    const response = await fetch('/api/nfts?page=1&pageSize=4&sort=priceEth&sortOrder=asc');
    if (!response.ok) throw new Error(`Catálogo indisponível: ${response.status}`);
    const result = (await response.json()) as { items: Array<{ id: string }> };
    return result.items.map(({ id }) => id);
  });
  expect(nfts).toHaveLength(4);
  await seedCart(page, nfts);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.locator('.cart-line')).toHaveCount(4);
  await expect(page.locator('.cart-summary .total dd')).not.toHaveText('—');
  await expectScreenshot(page, 'cart.png');
});

test('pagamento: visual baseline com carteira e quote carregadas', async ({ page }) => {
  await seedCart(page, ['emerald-ape-042']);
  await page.goto('/checkout');
  const vw = page.viewportSize()?.width ?? 1440;
  const isMobileLayout = vw <= 520;
  await expect(
    page.getByRole('heading', {
      name: isMobileLayout ? 'Pagamento com carteira' : 'Perfil do colecionador',
    }),
  ).toBeVisible();
  await expect(page.locator('.checkout-breakdown .total dd')).not.toHaveText('—');
  await expect(page.getByRole('radio')).toHaveCount(isMobileLayout ? 2 : 1);
  await page.evaluate(() => document.fonts.ready);
  await expectScreenshot(page, 'payment.png');
});

test('tablet 768px: home sem overflow horizontal', async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 1440) !== 768,
    'Apenas no projeto chromium-tablet',
  );
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await page.locator('.nft-grid .nft-card').first().waitFor();
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const vw = page.viewportSize()!.width;
  expect(bodyWidth).toBeLessThanOrEqual(vw + 2);
  await expectScreenshot(page, 'home-tablet.png', false);
});

test('tablet 768px: detalhe sem overflow horizontal', async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 1440) !== 768,
    'Apenas no projeto chromium-tablet',
  );
  await page.goto('/nft/emerald-ape-042');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await page.locator('.detail-main-image').waitFor();
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const vw = page.viewportSize()!.width;
  expect(bodyWidth).toBeLessThanOrEqual(vw + 2);
  await expectScreenshot(page, 'detail-tablet.png');
});

test('tablet 768px: carrinho sem overflow horizontal', async ({ page }) => {
  test.skip(
    (page.viewportSize()?.width ?? 1440) !== 768,
    'Apenas no projeto chromium-tablet',
  );
  const nfts = await page.evaluate(async () => {
    const response = await fetch('/api/nfts?page=1&pageSize=2&sort=priceEth&sortOrder=asc');
    if (!response.ok) throw new Error(`Catálogo indisponível: ${response.status}`);
    const result = (await response.json()) as { items: Array<{ id: string }> };
    return result.items.map(({ id }) => id);
  });
  await seedCart(page, nfts);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.locator('.cart-line')).toHaveCount(2);
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const vw = page.viewportSize()!.width;
  expect(bodyWidth).toBeLessThanOrEqual(vw + 2);
  await expectScreenshot(page, 'cart-tablet.png');
});
