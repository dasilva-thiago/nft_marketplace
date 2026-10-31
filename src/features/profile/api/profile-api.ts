import type {
  ChangePasswordRequest,
  CollectorProfile,
  UpdateProfileRequest,
} from '@/shared/contracts';
import {
  ChangePasswordRequestSchema,
  CollectorProfileSchema,
  UpdateProfileRequestSchema,
} from '@/shared/contracts/schemas';
import { http } from '@/shared/api/http-client';

export const profileApi = {
  async get(signal?: AbortSignal): Promise<CollectorProfile> {
    const response = await http.get<unknown>('/profile', { signal });
    return CollectorProfileSchema.parse(response.data);
  },

  async update(input: UpdateProfileRequest): Promise<CollectorProfile> {
    const response = await http.patch<unknown>('/profile', UpdateProfileRequestSchema.parse(input));
    return CollectorProfileSchema.parse(response.data);
  },

  async changePassword(input: ChangePasswordRequest): Promise<{ updated: true }> {
    const response = await http.patch<{ updated: true }>(
      '/profile/password',
      ChangePasswordRequestSchema.parse(input),
    );
    return response.data;
  },
};
