import type { CreateWalletRequest, UpdateWalletRequest, Wallet } from '@/shared/contracts';

const initialWallets = () =>
  new Map<string, Wallet[]>([
    [
      'collector-ana',
      [
        {
          id: 'wallet-ana-primary',
          userId: 'collector-ana',
          label: 'MetaMask principal',
          address: '0xAnaKurioPrimary',
          network: 'Ethereum',
          isPrimary: true,
          version: 1,
        },
      ],
    ],
    [
      'collector-bruno',
      [
        {
          id: 'wallet-bruno-primary',
          userId: 'collector-bruno',
          label: 'Carteira principal',
          address: '0xBrunoKurioPrimary',
          network: 'Polygon',
          isPrimary: true,
          version: 1,
        },
      ],
    ],
  ]);

let wallets = initialWallets();

export function listWalletsForUser(userId: string): Wallet[] {
  return (wallets.get(userId) ?? []).map((wallet) => ({ ...wallet }));
}

export function createWalletForUser(userId: string, input: CreateWalletRequest): Wallet {
  const current = listWalletsForUser(userId);
  const shouldBePrimary = input.isPrimary ?? current.length === 0;
  const next = current.map((wallet) =>
    shouldBePrimary ? { ...wallet, isPrimary: false, version: wallet.version + 1 } : wallet,
  );
  const wallet: Wallet = {
    id: `wallet-${userId}-${Date.now()}`,
    userId,
    label: input.label,
    address: input.address,
    network: input.network,
    isPrimary: shouldBePrimary,
    version: 1,
  };
  wallets.set(userId, [...next, wallet]);
  return wallet;
}

export function updateWalletForUser(
  userId: string,
  walletId: string,
  input: UpdateWalletRequest,
): Wallet | undefined {
  const current = listWalletsForUser(userId);
  const target = current.find((wallet) => wallet.id === walletId);
  if (!target) return undefined;
  const shouldBePrimary = input.isPrimary ?? target.isPrimary;
  const updated = current.map((wallet) => {
    if (wallet.id === walletId)
      return { ...wallet, ...input, isPrimary: shouldBePrimary, version: wallet.version + 1 };
    return shouldBePrimary ? { ...wallet, isPrimary: false, version: wallet.version + 1 } : wallet;
  });
  wallets.set(userId, updated);
  return updated.find((wallet) => wallet.id === walletId);
}

export function resetMockWalletsState(): void {
  wallets = initialWallets();
}
