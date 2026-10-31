import { expect, test } from '@playwright/test';

test('home mostra cards e filtro selecionado fica refletido na URL', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Pixel Cat #014/ })).toBeVisible();

  const mobileFilterTrigger = page.getByRole('button', { name: 'Abrir filtros' });
  if (await mobileFilterTrigger.isVisible()) await mobileFilterTrigger.click();
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

  const mobileFilterTrigger = page.getByRole('button', { name: 'Abrir filtros' });
  if (await mobileFilterTrigger.isVisible()) await mobileFilterTrigger.click();
  await page.getByLabel('Ordenar por').selectOption('name:desc');
  await expect(page).toHaveURL(/sort=name/);
  await page.goBack();
  await expect(page.getByRole('searchbox', { name: 'Buscar NFTs' })).toHaveValue('samurai');
  await expect(page.getByRole('link', { name: /Neon Samurai #021/ })).toBeVisible();
});

test('filtros combinados de coleção, rede, trait e preço ficam na URL', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Pixel Cat #014/ }).waitFor();
  const mobileFilterTrigger = page.getByRole('button', { name: 'Abrir filtros' });
  if (await mobileFilterTrigger.isVisible()) await mobileFilterTrigger.click();

  await page.getByRole('button', { name: 'Neo Apes' }).click();
  await page.getByRole('button', { name: 'Polygon' }).click();
  await page.getByLabel('Atributo').fill('Moon');
  await page.getByLabel('mín.').fill('0.6');
  await page.getByLabel('máx.').fill('1');

  await expect(page).toHaveURL(/collection=Neo(%20|\+)Apes/);
  await expect(page).toHaveURL(/network=Polygon/);
  await expect(page).toHaveURL(/trait=Moon/);
  await expect(page).toHaveURL(/priceMin=0.6/);
  await expect(page).toHaveURL(/priceMax=1/);
  await expect(page.getByRole('link', { name: /Lunar Ape #077/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toHaveCount(0);
});

test('hero mobile mantém texto e arte lado a lado em uma composição compacta', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();

  const layout = await page.evaluate(() => {
    const hero = document.querySelector('.home-reference .market-hero')!.getBoundingClientRect();
    const copy = document.querySelector('.home-reference .hero-copy')!.getBoundingClientRect();
    const art = document.querySelector('.home-reference .hero-art-wrap')!.getBoundingClientRect();
    return {
      heroHeight: hero.height,
      copyRight: copy.right,
      copyBottom: copy.bottom,
      artLeft: art.left,
      artTop: art.top,
      artRight: art.right,
      heroRight: hero.right,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    };
  });

  expect(layout.heroHeight).toBeLessThan(250);
  expect(layout.artLeft).toBeGreaterThanOrEqual(layout.copyRight);
  expect(layout.artTop).toBeLessThan(layout.copyBottom);
  expect(layout.artRight).toBeLessThanOrEqual(layout.heroRight);
  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 1);
});
