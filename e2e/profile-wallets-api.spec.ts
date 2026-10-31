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

test('perfil e carteiras persistem por usuário e validam conflitos', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const { authApi, readApiError } = await import('/src/features/auth/api/auth-api.ts');
    const { profileApi } = await import('/src/features/profile/api/profile-api.ts');
    const { walletsApi } = await import('/src/features/wallets/api/wallets-api.ts');
    await authApi.login({ email: 'ana@kurio.demo', password: 'Kurio#2026!' });
    const updatedProfile = await profileApi.update({ name: 'Ana Colecionadora' });
    const password = await profileApi.changePassword({
      currentPassword: 'Kurio#2026!',
      newPassword: 'KurioNova#2026!',
    });
    const initialWallets = await walletsApi.list();
    const secondary = await walletsApi.create({
      label: 'Carteira secundária',
      address: '0xAnaKurioSecondary',
      network: 'Polygon',
    });
    const promoted = await walletsApi.update(secondary.id, { isPrimary: true });
    const walletsAfterUpdate = await walletsApi.list();
    const duplicate = await walletsApi
      .create({
        label: 'Duplicada',
        address: '0xAnaKurioSecondary',
        network: 'Polygon',
      })
      .then(
        () => null,
        (error: unknown) => ({
          status: (error as { response?: { status?: number } }).response?.status,
          apiError: readApiError(error),
        }),
      );
    await authApi.logout();
    await authApi.login({ email: 'bruno@kurio.demo', password: 'Market#2026!' });
    const brunoProfile = await profileApi.get();
    const brunoWallets = await walletsApi.list();
    return {
      updatedProfile,
      password,
      initialWallets,
      promoted,
      walletsAfterUpdate,
      duplicate,
      brunoProfile,
      brunoWallets,
    };
  });

  expect(result.updatedProfile.name).toBe('Ana Colecionadora');
  expect(result.password.updated).toBe(true);
  expect(result.initialWallets).toHaveLength(1);
  expect(result.promoted.isPrimary).toBe(true);
  expect(result.walletsAfterUpdate.filter((wallet) => wallet.isPrimary)).toHaveLength(1);
  expect(result.duplicate?.status).toBe(409);
  expect(result.duplicate?.apiError?.code).toBe('CONFLICT');
  expect(result.brunoProfile.name).toBe('Bruno Costa');
  expect(result.brunoWallets).toHaveLength(1);
});
