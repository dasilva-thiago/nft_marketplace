import { expect, test } from '@playwright/test';

test('catálogo filtra e pagina dados recebidos pelo Axios/MSW', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Peças em destaque' }).waitFor();
  const result = await page.evaluate(async () => {
    const { catalogApi } = await import('/src/features/catalog/api/catalog-api.ts');
    const firstPage = await catalogApi.list({
      page: 1,
      pageSize: 4,
      sort: 'priceEth',
      sortOrder: 'asc',
    });
    const secondPage = await catalogApi.list({
      page: 2,
      pageSize: 4,
      sort: 'priceEth',
      sortOrder: 'asc',
    });
    const filtered = await catalogApi.list({
      page: 1,
      pageSize: 12,
      filters: { collection: 'Neo Apes' },
    });
    return { firstPage, secondPage, filtered };
  });

  expect(result.firstPage.items).toHaveLength(4);
  expect(result.firstPage.totalItems).toBe(12);
  expect(result.firstPage.totalPages).toBe(3);
  expect(result.secondPage.page).toBe(2);
  expect(result.secondPage.items[0]?.id).not.toBe(result.firstPage.items[0]?.id);
  expect(result.filtered.items.length).toBeGreaterThan(0);
  expect(result.filtered.items.every((item) => item.collection === 'Neo Apes')).toBe(true);
});

test('detalhe existe e identificador desconhecido devolve 404', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Peças em destaque' }).waitFor();
  const result = await page.evaluate(async () => {
    const { catalogApi } = await import('/src/features/catalog/api/catalog-api.ts');
    const nft = await catalogApi.get('emerald-ape-042');
    const missing = await catalogApi.get('nft-does-not-exist').then(
      () => ({ status: 200 }),
      (error: { response?: { status?: number } }) => ({ status: error.response?.status ?? 0 }),
    );
    return { nft, missing };
  });
  expect(result.nft.name).toBe('Emerald Ape #042');
  expect(result.missing.status).toBe(404);
});

test('parâmetros de página inválidos são rejeitados pelo contrato Zod no MSW', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Peças em destaque' }).waitFor();
  const status = await page.evaluate(async () => {
    const { catalogApi } = await import('/src/features/catalog/api/catalog-api.ts');
    return catalogApi.list({ page: 0, pageSize: 0 }).then(
      () => 200,
      (error: { response?: { status?: number } }) => error.response?.status ?? 0,
    );
  });
  expect(status).toBe(400);
});
