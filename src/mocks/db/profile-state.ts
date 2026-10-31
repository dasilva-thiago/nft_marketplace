import type { CollectorProfile, UpdateProfileRequest } from '@/shared/contracts';
import { userFixtures } from '../fixtures/users';

const PROFILE_STORAGE_KEY = 'kurio.mock.profiles';

function initialProfiles(loadStored = true) {
  const defaults = userFixtures.map(
    (user) =>
      [
        user.id,
        { userId: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
      ] as const,
  );
  if (!loadStored || typeof sessionStorage === 'undefined') return new Map(defaults);
  try {
    const stored = JSON.parse(sessionStorage.getItem(PROFILE_STORAGE_KEY) ?? 'null') as
      | CollectorProfile[]
      | null;
    return new Map(stored?.length ? stored.map((profile) => [profile.userId, profile]) : defaults);
  } catch {
    return new Map(defaults);
  }
}

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
  if (typeof sessionStorage !== 'undefined')
    sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify([...profiles.values()]));
  return updated;
}

export function resetMockProfileState(): void {
  profiles = initialProfiles(false);
  if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(PROFILE_STORAGE_KEY);
}
