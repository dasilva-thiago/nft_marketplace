import { expect, test } from '@playwright/test';

test('a fundação carrega a home sem erro de aplicação', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Marketplace de NFTs' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Base arquitetural, não produto concluído');
});
