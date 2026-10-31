import { expect, test } from './fixtures';

test('reset restaura fixtures e limpa estado persistido do cliente e do MSW', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();

  await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { favoritesApi } = await import('/src/features/favorites/api/favorites-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 1 });
    await favoritesApi.add('emerald-ape-042');
    await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'payment-pending' }),
    });
    localStorage.setItem(
      'kurio-guest-cart-v1',
      JSON.stringify([{ nftId: 'desert-ape-117', quantity: 1 }]),
    );
  });

  const result = await page.evaluate(async () => {
    const response = await fetch('/api/__mock/reset', { method: 'POST' });
    return {
      ok: response.ok,
      payload: await response.json(),
      sessionKeys: Object.keys(sessionStorage),
      localStorageKeys: Object.keys(localStorage),
    };
  });
  expect(result.ok).toBeTruthy();
  expect(result.payload).toEqual({ scenario: 'default', reset: true });
  expect(result.sessionKeys).toHaveLength(0);
  expect(result.localStorageKeys).toHaveLength(0);

  await page.reload();
  await expect(page.getByRole('link', { name: 'Entrar' })).toBeVisible();
  const defaults = await page.evaluate(async () => {
    const { getGuestLines } = await import('/src/features/cart/guest-cart.ts');
    return { scenario: sessionStorage.getItem('kurio.mock.scenario'), guest: getGuestLines() };
  });
  expect(defaults).toEqual({ scenario: null, guest: [] });
});
