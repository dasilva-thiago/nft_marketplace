import { expect, test } from '@playwright/test';

test('home mostra cards e filtro selecionado fica refletido na URL', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pixel Cat #014/ })).toBeVisible();

  await page.getByRole('button', { name: 'Neo Apes' }).click();
  await expect(page).toHaveURL(/collection=Neo(%20|\+)Apes/);
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Pixel Cat #014/ })).toHaveCount(0);
});

test('busca e ordenação alteram dados e podem ser restauradas pelo histórico', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Buscar NFTs' });
  await search.fill('samurai');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/search=samurai/);
  await expect(page.getByRole('link', { name: /Neon Samurai #021/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toHaveCount(0);

  await page.getByLabel('Ordenar por').selectOption('name:desc');
  await expect(page).toHaveURL(/sort=name/);
  await page.goBack();
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('samurai');
  await expect(page.getByRole('link', { name: /Neon Samurai #021/ })).toBeVisible();
});
