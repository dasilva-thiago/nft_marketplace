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

test('cadastro, sessão, refresh e logout não expõem senha', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const email = `collector-${Date.now()}@kurio.demo`;
    const created = await authApi.register({
      name: 'Colecionador Demo',
      email,
      password: 'Secure#2026',
    });
    const storedSessionHandle = sessionStorage.getItem('kurio.mock.session');
    const refreshed = await authApi.getSession();
    await authApi.logout();
    const afterLogout = await authApi.getSession();
    return { created, storedSessionHandle, refreshed, afterLogout, storage: { ...sessionStorage } };
  });

  expect(result.created.user.email).toContain('@kurio.demo');
  expect(result.created).not.toHaveProperty('password');
  expect(result.refreshed?.user.email).toBe(result.created.user.email);
  expect(result.storedSessionHandle).toMatch(/^mock-session-/);
  expect(result.afterLogout).toBeNull();
  expect(JSON.stringify(result.storage)).not.toContain('Secure#2026');
});

test('credencial inválida, validação e conflito usam erros tipados', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { authApi, readApiError } = await import('/src/features/auth/api/auth-api.ts');
    const invalidLogin = await authApi
      .login({ email: 'ana@kurio.demo', password: 'senha-incorreta' })
      .then(
        () => null,
        (error: unknown) => ({
          status: (error as { response?: { status?: number } }).response?.status,
          apiError: readApiError(error),
        }),
      );
    const invalidRegisterResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'not-an-email', password: 'short' }),
    });
    const invalidRegister = {
      status: invalidRegisterResponse.status,
      apiError: (await invalidRegisterResponse.json()) as ReturnType<typeof readApiError>,
    };
    const conflict = await authApi
      .register({ name: 'Outra Ana', email: 'ana@kurio.demo', password: 'Secure#2026' })
      .then(
        () => null,
        (error: unknown) => ({
          status: (error as { response?: { status?: number } }).response?.status,
          apiError: readApiError(error),
        }),
      );
    return { invalidLogin, invalidRegister, conflict };
  });

  expect(result.invalidLogin?.status).toBe(401);
  expect(result.invalidLogin?.apiError?.code).toBe('SESSION_INVALID');
  expect(result.invalidRegister?.status).toBe(400);
  expect(result.invalidRegister?.apiError?.code).toBe('VALIDATION_ERROR');
  expect(result.invalidRegister?.apiError?.fields).toMatchObject({
    email: expect.any(String),
    password: expect.any(String),
  });
  expect(result.conflict?.status).toBe(409);
  expect(result.conflict?.apiError?.code).toBe('CONFLICT');
});

test('expiração simulada remove a sessão e usuários permanecem isolados', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const ana = await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    await authApi.logout();
    const bruno = await authApi.login({ email: 'bruno@kurio.demo', password: 'Market#2026!' });
    const brunoSession = await authApi.getSession();
    await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'session-expired' }),
    });
    const expired = await authApi.getSession();
    return {
      ana: ana.user,
      bruno: bruno.user,
      brunoSession,
      expired,
      stored: sessionStorage.getItem('kurio.mock.session'),
    };
  });

  expect(result.ana.email).toBe('ana@kurio.demo');
  expect(result.bruno.email).toBe('bruno@kurio.demo');
  expect(result.bruno.email).not.toBe(result.ana.email);
  expect(result.brunoSession?.user.id).toBe('collector-bruno');
  expect(result.expired).toBeNull();
  expect(result.stored).toBeNull();
});
