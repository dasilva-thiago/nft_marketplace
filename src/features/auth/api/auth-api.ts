import type { LoginRequest, RegisterRequest, Session } from '@/shared/contracts';
import {
  ApiErrorSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  SessionSchema,
} from '@/shared/contracts/schemas';
import { http } from '@/shared/api/http-client';
import { setSessionCredential, clearSessionCredential } from '@/shared/storage/session-credential';

function readSession(response: { data: unknown; headers: Record<string, unknown> }): Session {
  const session = SessionSchema.parse(response.data);
  const sessionHandle = response.headers['x-mock-session'];
  if (typeof sessionHandle === 'string' && sessionHandle.length > 0)
    setSessionCredential(sessionHandle);
  return session;
}

export function readApiError(error: unknown): ReturnType<typeof ApiErrorSchema.parse> | null {
  if (!error || typeof error !== 'object' || !('response' in error)) return null;
  const response = (error as { response?: { data?: unknown } }).response;
  const parsed = ApiErrorSchema.safeParse(response?.data);
  return parsed.success ? parsed.data : null;
}

export const authApi = {
  async register(input: RegisterRequest): Promise<Session> {
    const payload = RegisterRequestSchema.parse(input);
    const response = await http.post<unknown>('/auth/register', payload);
    return readSession(response);
  },

  async login(input: LoginRequest): Promise<Session> {
    const payload = LoginRequestSchema.parse(input);
    const response = await http.post<unknown>('/auth/login', payload);
    return readSession(response);
  },

  async getSession(): Promise<Session | null> {
    try {
      const response = await http.get<unknown>('/session');
      return SessionSchema.parse(response.data);
    } catch (error: unknown) {
      const apiError = readApiError(error);
      if (
        apiError?.code === 'SESSION_INVALID' ||
        (error as { response?: { status?: number } })?.response?.status === 401
      ) {
        clearSessionCredential();
        return null;
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await http.post('/auth/logout');
    } finally {
      clearSessionCredential();
    }
  },
};
