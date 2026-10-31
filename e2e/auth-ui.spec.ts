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

test('login preserva o destino privado e mostra a sessão no cabeçalho', async ({ page }) => {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Entre para continuar' })).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fcart/);

  await page.getByLabel('E-mail').fill('ana@kurio.demo');
  await page.getByLabel('Senha').fill('Kurio#2026!');
  await page.getByRole('button', { name: 'Entrar na conta' }).click();

  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByRole('heading', { name: 'Carrinho de NFTs' })).toBeVisible();
  await expect(page.getByText('Ana Silva')).toBeVisible();
});

test('cadastro valida campos, cria a conta e recupera a sessão no refresh', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByText('Informe seu nome.')).toBeVisible();
  await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();

  await page.getByLabel('Nome').fill('Nova Colecionadora');
  await page.getByLabel('E-mail').fill(`nova-${Date.now()}@kurio.demo`);
  await page.getByLabel('Senha').fill('Secure#2026');
  await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page).toHaveURL(
    /\/\?page=1&search=&collection=&network=&trait=&priceMin=&priceMax=&sort=priceEth&sortOrder=asc$/,
  );
  await expect(page.getByText('Nova Colecionadora')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Nova Colecionadora')).toBeVisible();
});

test('erro de credencial é acessível e logout encerra a sessão', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('ana@kurio.demo');
  await page.getByLabel('Senha').fill('senha-incorreta');
  await page.getByRole('button', { name: 'Entrar na conta' }).click();
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.');

  await page.getByLabel('Senha').fill('Kurio#2026!');
  await page.getByRole('button', { name: 'Entrar na conta' }).click();
  await expect(page.getByText('Ana Silva')).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible();
});

test('sessão expirada durante navegação retorna à proteção de rota', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('ana@kurio.demo');
  await page.getByLabel('Senha').fill('Kurio#2026!');
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
