import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangePasswordRequest, UpdateProfileRequest } from '@/shared/contracts';
import { useSessionQuery } from '@/features/auth/queries';
import { profileApi } from './api/profile-api';

export const profileKeys = {
  all: ['private', 'profile'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
};

export function profileQuery(userId: string) {
  return queryOptions({
    queryKey: profileKeys.detail(userId),
    queryFn: ({ signal }) => profileApi.get(signal),
    retry: false,
  });
}

export function useProfileQuery() {
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useQuery({
    ...profileQuery(userId ?? 'anonymous'),
    enabled: Boolean(userId),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();
  const userId = sessionQuery.data?.user.id;
  return useMutation({
    mutationFn: (input: UpdateProfileRequest) => profileApi.update(input),
    retry: false,
    onSuccess: (profile) => {
      if (userId) queryClient.setQueryData(profileKeys.detail(userId), profile);
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) => profileApi.changePassword(input),
    retry: false,
  });
}
