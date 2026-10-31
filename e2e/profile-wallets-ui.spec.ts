import { expect, test } from '@playwright/test';

async function signIn(page: import('@playwright/test').Page) {
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
}

async function navigateTo(
  page: import('@playwright/test').Page,
  to: '/account/profile' | '/account/wallets',
) {
  await page.evaluate(async (path) => {
    const { router } = await import('/src/app/router.tsx');
    await router.navigate({ to: path });
  }, to);
}

test('perfil valida confirmação, salva avatar e recupera os dados após refresh', async ({
  page,
}) => {
  await signIn(page);
  await navigateTo(page, '/account/profile');
  await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible();

  await page.getByLabel('Senha atual').fill('Kurio#2026!');
  await page.getByLabel('Nova senha', { exact: true }).fill('KurioNova#2026!');
  await page.getByLabel('Confirmar nova senha').fill('OutraSenha#2026!');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('status')).toContainText('não confere');

  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('KurioNova#2026!');
  await page.getByRole('button', { name: 'Alterar' }).click();
  await page.getByRole('button', { name: /monkey2\.webp/ }).click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('status')).toContainText('Perfil atualizado');
  await expect(page.getByAltText('Avatar selecionado')).toBeVisible();

  await page.reload();
  await expect(page.getByAltText('Avatar selecionado')).toBeVisible();
});

test('carteira editada permanece preenchida após refresh da tela', async ({ page }) => {
  await signIn(page);
  await navigateTo(page, '/account/wallets');
  await expect(page.getByRole('heading', { name: 'Carteira principal' })).toBeVisible();

  const label = page.getByLabel('Apelido da carteira*');
  await label.fill('Carteira principal atualizada');
  await page.getByRole('button', { name: 'Salvar carteira' }).click();
  await expect(page.getByRole('status')).toContainText('Carteira salva');

  await page.reload();
  await expect(page.getByLabel('Apelido da carteira*')).toHaveValue(
    'Carteira principal atualizada',
  );
});
