import type { CreateWalletRequest, UpdateWalletRequest, Wallet } from '@/shared/contracts';
import {
  CreateWalletRequestSchema,
  UpdateWalletRequestSchema,
  WalletsSchema,
  WalletSchema,
} from '@/shared/contracts/schemas';
import { http } from '@/shared/api/http-client';

export const walletsApi = {
  async list(signal?: AbortSignal): Promise<Wallet[]> {
    const response = await http.get<unknown>('/wallets', { signal });
    return WalletsSchema.parse(response.data);
  },

  async create(input: CreateWalletRequest): Promise<Wallet> {
    const response = await http.post<unknown>('/wallets', CreateWalletRequestSchema.parse(input));
    return WalletSchema.parse(response.data);
  },

  async update(walletId: string, input: UpdateWalletRequest): Promise<Wallet> {
    const response = await http.patch<unknown>(
      `/wallets/${walletId}`,
      UpdateWalletRequestSchema.parse(input),
    );
    return WalletSchema.parse(response.data);
  },
};
