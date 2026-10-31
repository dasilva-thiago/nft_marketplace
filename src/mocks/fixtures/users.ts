import type { UserSummary } from '@/shared/contracts';

export interface MockUserRecord extends UserSummary {
  passwordHash: string;
}

/**
 * Credenciais exclusivas da demonstração. O mock guarda somente SHA-256 para
 * evitar senha em claro; isso não substitui Argon2/bcrypt em um servidor real.
 */
export const userFixtures: MockUserRecord[] = [
  {
    id: 'collector-ana',
    name: 'Ana Silva',
    email: 'ana@kurio.demo',
    avatarUrl: null,
    passwordHash: '794e86ec9fc25a8b73f0fbc665814194c27d2d85bde437b2ad036e1171f0de78',
  },
  {
    id: 'collector-bruno',
    name: 'Bruno Costa',
    email: 'bruno@kurio.demo',
    avatarUrl: null,
    passwordHash: '7d1597db124b2f80f7a7acae8266ac6bf8825bac36735e533740989bf6821a7c',
  },
];
