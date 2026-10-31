import type { CollectorProfile, UpdateProfileRequest } from '@/shared/contracts';
import { userFixtures } from '../fixtures/users';

const initialProfiles = () =>
  new Map<string, CollectorProfile>(
    userFixtures.map((user) => [
      user.id,
      { userId: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    ]),
  );

let profiles = initialProfiles();

export function getProfileForUser(userId: string): CollectorProfile | undefined {
  return profiles.get(userId);
}

export function updateProfileForUser(
  userId: string,
  input: UpdateProfileRequest,
): CollectorProfile | undefined {
  const current = profiles.get(userId);
  if (!current) return undefined;
  const updated = { ...current, ...input };
  profiles.set(userId, updated);
  return updated;
}

export function resetMockProfileState(): void {
  profiles = initialProfiles();
}
