import { expect, test } from './fixtures';

async function submitRegister(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /^Criar (conta|perfil)$/ }).click();
}

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

test('login preserva o destino privado e mostra a sessão no cabeçalho', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Entre para continuar' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcart/);

  await page.getByLabel('E-mail').fill('ana@kurio.demo');
  await page.getByLabel('Senha', { exact: true }).fill('Kurio#2026!');
  await page.getByRole('button', { name: 'Entrar na conta' }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  const sessionName = await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    return (await authApi.getSession())?.user.name;
  });
  expect(sessionName).toBe('Ana Silva');
  if ((page.viewportSize()?.width ?? 1440) <= 620) {
    await expect(page.locator('.site-header')).not.toBeVisible();
    await expect(page.locator('.cart-mobile-header')).toBeVisible();
  } else {
    await expect(page.getByText('Ana Silva')).toBeVisible();
  }
});

test('cadastro valida campos, cria a conta e recupera a sessão no refresh', async ({ page }) => {
  await page.goto('/register');
  await submitRegister(page);
  await expect(page.getByText('Informe seu nome.')).toBeVisible();
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();

  await page.getByLabel('Nome').fill('Nova Colecionadora');
  await page.getByLabel('E-mail').fill(`nova-${Date.now()}@kurio.demo`);
  await page.locator('#auth-password').fill('Secure#2026');
  await page.locator('#auth-passwordConfirmation').fill('Secure#2026');
  await submitRegister(page);
  await expect(page).toHaveURL(
    /\/\?page=1&search=&collection=&network=&trait=&priceMin=&priceMax=&sort=priceEth&sortOrder=asc$/,
  );
  await expect(page.getByText('Nova Colecionadora')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Nova Colecionadora')).toBeVisible();
});

test('cadastro impede envio quando a confirmação de senha diverge', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Nome').fill('Nova Colecionadora');
  await page.getByLabel('E-mail').fill(`diverge-${Date.now()}@kurio.demo`);
  await page.locator('#auth-password').fill('Secure#2026');
  await page.locator('#auth-passwordConfirmation').fill('Outro#2026');
  await submitRegister(page);
  await expect(page.getByText('As senhas não coincidem.')).toBeVisible();
  await expect(page).toHaveURL(/\/register/);
});

test('cadastro mostra título mobile e alterna a visibilidade das senhas', async ({ page }) => {
  await page.goto('/register');
  const password = page.locator('#auth-password');
  const confirmation = page.locator('#auth-passwordConfirmation');
  await expect(password).toHaveAttribute('type', 'password');
  await expect(confirmation).toHaveAttribute('type', 'password');

  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Mostrar confirmação de senha' }).click();
  await expect(confirmation).toHaveAttribute('type', 'text');

  const title = page.locator('.auth-mobile-title');
  if ((page.viewportSize()?.width ?? 1440) <= 620) {
    await expect(title).toHaveText('Criar perfil de colecionador');
    await expect(title).toBeVisible();
  } else {
    await expect(title).not.toBeVisible();
  }
});

test('erro de credencial é acessível e logout encerra a sessão', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('ana@kurio.demo');
  await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta');
  await page.getByRole('button', { name: 'Entrar na conta' }).click();
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.');

  await page.getByLabel('Senha', { exact: true }).fill('Kurio#2026!');
  await page.getByRole('button', { name: 'Entrar na conta' }).click();
  await expect(page.getByText('Ana Silva')).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
});

test('sessão expirada durante navegação retorna à proteção de rota', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('ana@kurio.demo');
  await page.getByLabel('Senha', { exact: true }).fill('Kurio#2026!');
  await page.getByRole('button', { name: 'Entrar na conta' }).click();
  await expect(page.getByText('Ana Silva')).toBeVisible();

  await page.evaluate(async () => {
    await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'session-expired' }),
    });
  });
  await page.goto('/account/profile');
  await expect(page.getByRole('heading', { name: 'Entre para continuar' })).toBeVisible();
});
