import { expect, test } from './fixtures';

test('autenticação associa erros aos campos e mantém foco navegável', async ({ page }) => {
  await page.goto('/login');

  const email = page.getByRole('textbox', { name: 'E-mail' });
  const password = page.getByRole('textbox', { name: 'Senha' });
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveCount(1);
  await expect(page.locator(':focus')).toHaveAttribute('href', /./);

  await email.fill('email-invalido');
  await password.fill('curta');
  await page.getByRole('button', { name: 'Entrar na conta' }).click();

  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(password).toHaveAttribute('aria-invalid', 'true');
  const emailErrorId = await email.getAttribute('aria-describedby');
  const passwordErrorId = await password.getAttribute('aria-describedby');
  expect(emailErrorId).toBeTruthy();
  expect(passwordErrorId).toBeTruthy();
  await expect(page.locator(`#${emailErrorId}`)).toBeVisible();
  await expect(page.locator(`#${passwordErrorId}`)).toBeVisible();
});

test('cadastro expõe confirmação de senha como campo nomeado', async ({ page }) => {
  await page.goto('/register');
  const confirmation = page.getByLabel('Confirmar senha');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toHaveAttribute('name', 'passwordConfirmation');
});

test('login desktop é modal, contém o foco e fecha com Escape', async ({ page }, testInfo) => {
  test.skip(
    !testInfo.project.name.includes('desktop'),
    'Comportamento modal só existe no desktop.',
  );
  await page.goto('/login');
  const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');

  const close = dialog.getByRole('link', { name: 'Fechar autenticação' });
  await dialog.getByRole('link', { name: 'Crie uma conta' }).focus();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/\?page=1&/);
});
