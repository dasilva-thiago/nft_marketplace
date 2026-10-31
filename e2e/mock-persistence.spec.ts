import { expect, test } from './fixtures';

test('estado simulado dos domínios sobrevive a refresh sem cruzar a identidade', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'SEJA DONO DO FUTURO DA ARTE DIGITAL' }),
  ).toBeVisible();

  const created = await page.evaluate(async () => {
    const reset = await fetch('/api/__mock/reset', { method: 'POST' });
    if (!reset.ok) throw new Error(`Reset falhou: ${reset.status}`);

    const suffix = Date.now();
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { favoritesApi } = await import('/src/features/favorites/api/favorites-api.ts');
    const { profileApi } = await import('/src/features/profile/api/profile-api.ts');
    const { walletsApi } = await import('/src/features/wallets/api/wallets-api.ts');
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    const session = await authApi.register({
      name: 'Conta Persistente',
      email: `persist-${suffix}@kurio.demo`,
      password: 'Kurio#2026!',
    });
    const cart = await cartApi.addItem({ nftId: 'emerald-ape-042', quantity: 2 });
    await favoritesApi.add('emerald-ape-042');
    await profileApi.update({ name: 'Perfil salvo no mock' });
    const wallet = await walletsApi.create({
      label: 'Carteira de persistência',
      address: `0xPersist${suffix}`,
      network: 'Ethereum',
      isPrimary: true,
    });
    const quote = await cartApi.quote({
      items: cart.items.map(({ nftId, quantity }) => ({ nftId, quantity })),
      walletId: wallet.id,
      network: wallet.network,
    });
    const scenario = await fetch('/api/__mock/scenario', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'payment-pending' }),
    });
    if (!scenario.ok) throw new Error(`Cenário falhou: ${scenario.status}`);
    const idempotencyKey = `persist-${suffix}`;
    const order = await ordersApi.create(
      { quoteId: quote.quoteId, walletId: wallet.id, network: wallet.network },
      idempotencyKey,
    );
    return {
      userId: session.user.id,
      email: session.user.email,
      walletId: wallet.id,
      orderId: order.id,
      idempotencyKey,
      quoteId: quote.quoteId,
    };
  });

  await page.reload();
  await expect(page.getByText('Conta Persistente')).toBeVisible();
  const restored = await page.evaluate(async (identity) => {
    const { authApi } = await import('/src/features/auth/api/auth-api.ts');
    const { cartApi } = await import('/src/features/cart/api/cart-api.ts');
    const { favoritesApi } = await import('/src/features/favorites/api/favorites-api.ts');
    const { profileApi } = await import('/src/features/profile/api/profile-api.ts');
    const { walletsApi } = await import('/src/features/wallets/api/wallets-api.ts');
    const { ordersApi } = await import('/src/features/orders/api/orders-api.ts');
    const { getQuoteForUser } = await import('/src/mocks/db/quotes-state.ts');
    const session = await authApi.getSession();
    if (!session) throw new Error('A sessão não foi reconstruída após refresh.');
    const [cart, favorites, profile, wallets, order, replay] = await Promise.all([
      cartApi.get(),
      favoritesApi.list(),
      profileApi.get(),
      walletsApi.list(),
      ordersApi.get(identity.orderId),
      ordersApi.recover(identity.idempotencyKey),
    ]);
    const savedQuote = getQuoteForUser(session.user.id, identity.quoteId);
    await authApi.logout();
    await authApi.login({ email: 'bruno@kurio.demo', password: 'Market#2026!' });
    const [brunoCart, brunoFavorites, brunoProfile, brunoWallets] = await Promise.all([
      cartApi.get(),
      favoritesApi.list(),
      profileApi.get(),
      walletsApi.list(),
    ]);
    return {
      userId: session.user.id,
      email: session.user.email,
      cartQuantity: cart.items.find((item) => item.nftId === 'emerald-ape-042')?.quantity,
      favoriteIds: favorites.map((item) => item.nftId),
      profileName: profile.name,
      walletIds: wallets.map((wallet) => wallet.id),
      orderStatus: order.status,
      replayedOrderId: replay.id,
      quoteId: savedQuote?.quoteId,
      brunoCartItems: brunoCart.items.length,
      brunoFavoriteIds: brunoFavorites.map((item) => item.nftId),
      brunoProfileName: brunoProfile.name,
      brunoWalletIds: brunoWallets.map((wallet) => wallet.id),
    };
  }, created);

  expect(restored).toEqual({
    userId: created.userId,
    email: created.email,
    cartQuantity: 2,
    favoriteIds: ['emerald-ape-042'],
    profileName: 'Perfil salvo no mock',
    walletIds: [created.walletId],
    orderStatus: 'pending',
    replayedOrderId: created.orderId,
    quoteId: created.quoteId,
    brunoCartItems: 0,
    brunoFavoriteIds: [],
    brunoProfileName: 'Bruno Costa',
    brunoWalletIds: ['wallet-bruno-primary'],
  });
});
