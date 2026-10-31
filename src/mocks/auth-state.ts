import type { Session, UserSummary } from '@/shared/contracts';
import { getMockScenario } from './scenarios/scenario-state';
import { userFixtures, type MockUserRecord } from './fixtures/users';

const SESSION_TTL_MS = 30 * 60 * 1000;

type MockSessionRecord = {
  sessionId: string;
  userId: string;
  user: UserSummary;
  expiresAt: string;
};

type EncodedSession = {
  user: UserSummary;
  expiresAt: string;
};

let users = new Map<string, MockUserRecord>(userFixtures.map((user) => [user.id, { ...user }]));
let sessions = new Map<string, MockSessionRecord>();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toUserSummary(user: MockUserRecord): UserSummary {
  const { passwordHash: _passwordHash, ...summary } = user;
  return summary;
}

async function hashMockPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function encodeSession(payload: EncodedSession): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `mock-session-${btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`;
}

function decodeSession(sessionId: string): EncodedSession | null {
  if (!sessionId.startsWith('mock-session-')) return null;
  try {
    const encoded = sessionId
      .slice('mock-session-'.length)
      .replaceAll('-', '+')
      .replaceAll('_', '/');
    const padded = encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    const payload: unknown = JSON.parse(decoded);
    if (
      !payload ||
      typeof payload !== 'object' ||
      !('user' in payload) ||
      !('expiresAt' in payload)
    )
      return null;
    const candidate = payload as { user: unknown; expiresAt: unknown };
    if (
      !candidate.user ||
      typeof candidate.user !== 'object' ||
      typeof candidate.expiresAt !== 'string'
    )
      return null;
    const user = candidate.user as Partial<UserSummary>;
    if (
      typeof user.id !== 'string' ||
      typeof user.name !== 'string' ||
      typeof user.email !== 'string'
    )
      return null;
    return {
      user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl ?? null },
      expiresAt: candidate.expiresAt,
    };
  } catch {
    return null;
  }
}

function createSession(user: MockUserRecord): { session: Session; sessionId: string } {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const userSummary = toUserSummary(user);
  const sessionId = encodeSession({ user: userSummary, expiresAt });
  sessions.set(sessionId, { sessionId, userId: user.id, user: userSummary, expiresAt });
  return { session: { user: userSummary, expiresAt }, sessionId };
}

function sessionFromRecord(record: MockSessionRecord): Session | null {
  if (Date.parse(record.expiresAt) <= Date.now() || getMockScenario() === 'session-expired') {
    sessions.delete(record.sessionId);
    return null;
  }
  return { user: record.user, expiresAt: record.expiresAt };
}

export function getUserByEmail(email: string): MockUserRecord | undefined {
  const normalizedEmail = normalizeEmail(email);
  return [...users.values()].find((user) => user.email === normalizedEmail);
}

export async function registerMockUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ session: Session; sessionId: string }> {
  const email = normalizeEmail(input.email);
  const user: MockUserRecord = {
    id: `collector-${Date.now()}`,
    name: input.name.trim(),
    email,
    avatarUrl: null,
    passwordHash: await hashMockPassword(input.password),
  };
  users.set(user.id, user);
  return createSession(user);
}

export async function loginMockUser(input: {
  email: string;
  password: string;
}): Promise<{ session: Session; sessionId: string } | null> {
  const user = getUserByEmail(input.email);
  if (!user || user.passwordHash !== (await hashMockPassword(input.password))) return null;
  return createSession(user);
}

export function getSessionFromRequest(
  request: Request,
): { session: Session; sessionId: string } | null {
  const sessionId = request.headers.get('x-mock-session');
  if (!sessionId) return null;
  const active = sessions.get(sessionId);
  if (active) {
    const session = sessionFromRecord(active);
    return session ? { session, sessionId } : null;
  }

  // O service worker reinicia o módulo em um refresh. O handle codificado
  // recompõe apenas a identidade fictícia e sua expiração; não é JWT nem segredo.
  const decoded = decodeSession(sessionId);
  if (
    !decoded ||
    Date.parse(decoded.expiresAt) <= Date.now() ||
    getMockScenario() === 'session-expired'
  )
    return null;
  const reconstructed: MockSessionRecord = {
    sessionId,
    userId: decoded.user.id,
    user: decoded.user,
    expiresAt: decoded.expiresAt,
  };
  sessions.set(sessionId, reconstructed);
  return { session: { user: reconstructed.user, expiresAt: reconstructed.expiresAt }, sessionId };
}

export function deleteSessionFromRequest(request: Request): void {
  const sessionId = request.headers.get('x-mock-session');
  if (sessionId) sessions.delete(sessionId);
}

export function resetMockAuthState(): void {
  users = new Map(userFixtures.map((user) => [user.id, { ...user }]));
  sessions = new Map();
}
