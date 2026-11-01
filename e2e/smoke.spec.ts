import { expect, test } from './fixtures';

test('a home do marketplace carrega hero e catálogo sem erro de aplicação', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();
  await expect(page.locator('.nft-card').first()).toBeVisible();
  await expect(page.getByRole('link', { name: /Pixel Cat #014/ })).toBeVisible();
});
