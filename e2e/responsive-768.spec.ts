import { expect, test } from '@playwright/test';

test('home, detalhe e carrinho não criam overflow horizontal em 768px', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();

  async function assertNoHorizontalOverflow(routeName: string) {
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
    }));
    expect(metrics.scrollWidth, `${routeName} document overflow`).toBeLessThanOrEqual(
      metrics.viewport + 1,
    );
    expect(metrics.bodyScrollWidth, `${routeName} body overflow`).toBeLessThanOrEqual(
      metrics.viewport + 1,
    );
  }

  await assertNoHorizontalOverflow('home');

  await page.evaluate(async () => {
    const { router } = await import('/src/app/router.tsx');
    await router.navigate({ to: '/nft/$nftId', params: { nftId: 'emerald-ape-042' } });
  });
  await expect(page.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible();
  await assertNoHorizontalOverflow('detail');

  await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    const { router } = await import('/src/app/router.tsx');
    await router.navigate({ to: '/cart' });
  });
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await assertNoHorizontalOverflow('cart');
});
