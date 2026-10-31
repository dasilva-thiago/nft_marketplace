import { expect, test } from '@playwright/test';

test('falha ao favoritar reverte o coração e anuncia o erro', async ({ page }) => {
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
    const scenario = await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'favorite-failure' }),
    });
    if (!scenario.ok) throw new Error(`Cenário de falha não ativado: ${scenario.status}`);
  });
  await page.reload();
  await expect(page.getByRole('link', { name: /Emerald Ape #042/ })).toBeVisible();

  const favorite = page.getByRole('button', { name: 'Favoritar Emerald Ape #042' });
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
  await favorite.click();
  await expect(page.getByRole('alert')).toContainText('Sua alteração foi desfeita');
  await expect(favorite).toHaveAttribute('aria-pressed', 'false');
});
