import { expect, test } from './fixtures';

async function seedCart(page: import('@playwright/test').Page) {
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
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
  });
}

test('carrinho mobile usa navegação e resumo fixos sem overflow', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Layout específico de mobile.');
  await seedCart(page);
  await page.goto('/cart');
  await expect(page.locator('.site-header')).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar ao mercado' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.locator('.cart-summary')).toBeVisible();
  await expect(page.locator('.cart-line-name small').first()).toBeVisible();
  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
    summaryPosition: getComputedStyle(document.querySelector('.cart-summary')!).position,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.summaryPosition).toBe('fixed');
});

test('carrinho desktop preserva a navegação global e o resumo lateral', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Layout específico de desktop.');
  await seedCart(page);
  await page.goto('/cart');
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.cart-mobile-header')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.locator('.cart-summary')).toBeVisible();
});

test('detalhe mobile oferece retorno/favorito no topo e remove chrome desktop', async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Layout específico de mobile.');
  await page.goto('/nft/emerald-ape-042');
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await expect(page.locator('.site-header')).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Voltar ao mercado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adicionar aos favoritos' })).toBeVisible();
  await expect(page.locator('.detail-page .detail-main-image img')).toBeVisible();
  const layout = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  expect(layout[0]).toBeLessThanOrEqual(layout[1]);
  await expect(page.locator('.detail-route-main .marketing-footer')).not.toBeVisible();
});

test('detalhe desktop preserva o header e a navegação de galeria', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes('mobile'), 'Layout específico de desktop.');
  await page.goto('/nft/emerald-ape-042');
  await expect(page.locator('.site-header')).toBeVisible();
  await expect(page.locator('.detail-mobile-header')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await expect(page.locator('.detail-thumbs button')).toHaveCount(1);
});
