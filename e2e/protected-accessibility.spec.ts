import { expect, test } from '@playwright/test';

test('formulários protegidos expõem nomes e landmarks acessíveis', async ({ page }) => {
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
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();

  await page.evaluate(async () => {
    const { router } = await import('/src/app/router.tsx');
    await router.navigate({ to: '/account/profile' });
  });
  await expect(page.getByRole('navigation', { name: 'Navegação da conta' })).toBeVisible();
  await expect(page.getByRole('form', { name: 'Perfil do colecionador' })).toBeVisible();
  await expect(page.getByLabel('Nome de exibição*')).toBeVisible();

  await page.evaluate(async () => {
    const { router } = await import('/src/app/router.tsx');
    await router.navigate({ to: '/account/wallets' });
  });
  await expect(page.getByRole('form', { name: 'Carteira principal' })).toBeVisible();
  await expect(page.getByLabel('Apelido da carteira*')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Carteiras cadastradas' })).toBeVisible();

  await page.evaluate(async () => {
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    const { router } = await import('/src/app/router.tsx');
    await router.navigate({ to: '/checkout' });
  });
  await expect(page.getByRole('form', { name: 'Perfil do colecionador' })).toBeVisible();
  await expect(page.getByLabel('Nome de exibição*')).toBeVisible();
  await expect(page.getByRole('complementary', { name: /Seus NFTs/ })).toBeVisible();
});
