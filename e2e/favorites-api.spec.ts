import { expect, test } from '@playwright/test';

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

test('favoritos são idempotentes, isolados e rejeitam NFT inexistente', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { authApi, readApiError } = await import('/src/features/auth/api/auth-api.ts');
    const { favoritesApi } = await import('/src/features/favorites/api/favorites-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    const first = await favoritesApi.add('emerald-ape-042');
    const second = await favoritesApi.add('emerald-ape-042');
    const anaFavorites = await favoritesApi.list();
    const missing = await favoritesApi.add('missing-nft').then(
      () => null,
      (error: unknown) => ({
        status: (error as { response?: { status?: number } }).response?.status,
        apiError: readApiError(error),
      }),
    );
    await favoritesApi.remove('emerald-ape-042');
    await favoritesApi.remove('emerald-ape-042');
    await authApi.logout();
    await authApi.login({ email: 'bruno@kurio.demo', password: 'Market#2026!' });
    const brunoFavorites = await favoritesApi.list();
    return { first, second, anaFavorites, missing, brunoFavorites };
  });

  expect(result.first.nftId).toBe('emerald-ape-042');
  expect(result.second).toEqual(result.first);
  expect(result.anaFavorites).toHaveLength(1);
  expect(result.missing?.status).toBe(404);
  expect(result.missing?.apiError?.code).toBe('NOT_FOUND');
  expect(result.brunoFavorites).toEqual([]);
});
